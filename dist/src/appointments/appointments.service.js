"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const date_fns_1 = require("date-fns");
const core_1 = require("@nestjs/core");
const common_2 = require("@nestjs/common");
const nest_winston_1 = require("nest-winston");
const date_fns_tz_1 = require("date-fns-tz");
let AppointmentsService = class AppointmentsService {
    constructor(prisma, req, logger) {
        this.prisma = prisma;
        this.req = req;
        this.logger = logger;
    }
    async create(dto) {
        return this.book({
            organizationId: dto.organizationId ?? this.req.organizationId,
            locationId: dto.locationId,
            serviceId: dto.serviceId,
            staffId: dto.staffId,
            customerId: dto.customerId,
            startsAt: new Date(dto.startsAt),
        });
    }
    /** Lista los turnos del tenant actual (max 100, orden desc). */
    findAll() {
        const orgId = this.req.organizationId;
        if (!orgId)
            throw new common_1.ForbiddenException('Tenant required');
        this.logger.info('List appointments', { ctx: 'appointments.findAll', orgId });
        return this.prisma.withOrg(orgId, tx => tx.appointment.findMany({ take: 100, orderBy: { startsAt: 'desc' } }));
    }
    /**
   * Reserva un turno (core):
   * - Calcula endsAt según duración del servicio
   * - Valida solapamiento por rango (staffId)
   * - Crea Appointment con status CONFIRMED
   */
    async book(params) {
        const orgId = this.req.organizationId ?? params.organizationId;
        if (!orgId)
            throw new common_1.ForbiddenException('Tenant required');
        return this.prisma.withOrg(orgId, async (tx) => {
            const service = await tx.service.findUnique({ where: { id: params.serviceId } });
            if (!service)
                throw new common_1.BadRequestException('Servicio no existe');
            const endsAt = (0, date_fns_1.addMinutes)(params.startsAt, service.durationMin);
            const overlap = await tx.appointment.findFirst({
                where: { staffId: params.staffId, startsAt: { lt: endsAt }, endsAt: { gt: params.startsAt } },
            });
            if (overlap) {
                this.logger.warn('Slot ocupado', {
                    ctx: 'appointments.book',
                    orgId,
                    staffId: params.staffId,
                    startsAt: params.startsAt.toISOString(),
                    endsAt: endsAt.toISOString(),
                });
                throw new common_1.BadRequestException('Slot ocupado');
            }
            const appt = await tx.appointment.create({ data: { ...params, endsAt, status: 'CONFIRMED' } });
            this.logger.info('Appointment created', {
                ctx: 'appointments.book',
                orgId, appointmentId: appt.id, staffId: appt.staffId,
            });
            return appt;
        });
    }
    /** Devuelve un turno por ID dentro del tenant actual. */
    async findOne(id) {
        const orgId = this.req.organizationId;
        if (!orgId)
            throw new common_1.ForbiddenException('Tenant required');
        this.logger.info('Get appointment', { ctx: 'appointments.findOne', orgId, id });
        return this.prisma.withOrg(orgId, (tx) => tx.appointment.findUnique({ where: { id } }));
    }
    /**
   * Actualiza estado y/o horario del turno:
   * - Recalcula endsAt segun service.durationMin si cambia startsAt
   * - Valida solapamientos con otros turnos del mismo staff
   */
    async update(id, data) {
        const orgId = this.req.organizationId;
        if (!orgId)
            throw new common_1.ForbiddenException('Tenant required');
        return this.prisma.withOrg(orgId, async (tx) => {
            const patch = {};
            if (typeof data.status === 'string')
                patch.status = data.status;
            if (typeof data.startsAt === 'string') {
                const appt = await tx.appointment.findUnique({ where: { id } });
                if (!appt)
                    throw new common_1.BadRequestException('Turno inexistente');
                const service = await tx.service.findUnique({ where: { id: appt.serviceId } });
                if (!service)
                    throw new common_1.BadRequestException('Servicio no existe');
                const startsAt = new Date(data.startsAt);
                const endsAt = (0, date_fns_1.addMinutes)(startsAt, service.durationMin);
                // chequear solapamiento
                const overlap = await tx.appointment.findFirst({
                    where: {
                        id: { not: id },
                        staffId: appt.staffId,
                        startsAt: { lt: endsAt },
                        endsAt: { gt: startsAt },
                    },
                });
                if (overlap) {
                    this.logger.warn('Slot ocupado (update)', {
                        ctx: 'appointments.update',
                        orgId, id, staffId: appt.staffId,
                        startsAt: startsAt.toISOString(),
                        endsAt: endsAt.toISOString(),
                    });
                    throw new common_1.BadRequestException('Slot ocupado');
                }
                patch.startsAt = startsAt;
                patch.endsAt = endsAt;
            }
            const updated = await tx.appointment.update({ where: { id }, data: patch });
            this.logger.info('Appointment updated', { ctx: 'appointments.update', orgId, id });
            return updated;
        });
    }
    /** Elimina un turno del tenant actual y registra el evento en logs. */
    async remove(id) {
        const orgId = this.req.organizationId;
        if (!orgId)
            throw new common_1.ForbiddenException('Tenant required');
        const deleted = await this.prisma.withOrg(orgId, (tx) => tx.appointment.delete({ where: { id } }));
        this.logger.info('Appointment removed', { ctx: 'appointments.remove', orgId, id });
        return deleted;
    }
    /**
   * Calcula slots disponibles para una fecha:
   * - Usa WorkingHours (por staff si existe, si no por location)
   * - Excluye TimeOff (staff o general de la sede)
   * - Excluye solapamientos con citas existentes
   */
    async getSlots(dateISO, serviceId, staffId, locationId) {
        const orgId = this.req.organizationId;
        if (!orgId)
            throw new common_1.ForbiddenException('Tenant required');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) {
            this.logger.warn('Invalid date format', { ctx: 'appointments.slots', dateISO });
            throw new common_1.BadRequestException('Formato de fecha inválido (YYYY-MM-DD)');
        }
        return this.prisma.withOrg(orgId, async (tx) => {
            const service = await tx.service.findUnique({ where: { id: serviceId } });
            if (!service)
                throw new common_1.BadRequestException('Servicio no existe');
            const loc = await tx.location.findUnique({ where: { id: locationId } });
            const tz = loc?.timezone || 'UTC';
            // Preparar día local
            const date = new Date(`${dateISO}T00:00:00Z`);
            const localDay = (0, date_fns_tz_1.toZonedTime)(date, tz);
            const weekday = localDay.getDay();
            // Working hours
            const wh = await tx.workingHours.findFirst({
                where: { locationId, staffId: staffId ?? null, weekday },
            }) || await tx.workingHours.findFirst({
                where: { locationId, staffId: null, weekday },
            });
            if (!wh) {
                this.logger.info('No working hours', { ctx: 'appointments.slots', orgId, weekday });
                return [];
            }
            // Construcción ventana
            const localStart = (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(localDay, Math.floor(wh.startMin / 60)), wh.startMin % 60);
            const localEnd = (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(localDay, Math.floor(wh.endMin / 60)), wh.endMin % 60);
            const dayStartUtc = (0, date_fns_tz_1.fromZonedTime)(localStart, tz);
            const dayEndUtc = (0, date_fns_tz_1.fromZonedTime)(localEnd, tz);
            // Citas existentes
            const existing = await tx.appointment.findMany({
                where: { staffId, startsAt: { gte: dayStartUtc }, endsAt: { lte: dayEndUtc } },
                select: { startsAt: true, endsAt: true },
            });
            // TimeOff
            const offs = await tx.timeOff.findMany({
                where: {
                    OR: [{ staffId }, { staffId: null, locationId }],
                    AND: [{ startsAt: { lt: dayEndUtc } }, { endsAt: { gt: dayStartUtc } }],
                },
                select: { startsAt: true, endsAt: true },
            });
            const duration = service.durationMin;
            const step = 15;
            const slots = [];
            for (let start = dayStartUtc; (0, date_fns_1.addMinutes)(start, duration) <= dayEndUtc; start = (0, date_fns_1.addMinutes)(start, step)) {
                const end = (0, date_fns_1.addMinutes)(start, duration);
                const conflictAppt = existing.some(a => !(end <= a.startsAt || start >= a.endsAt));
                if (conflictAppt)
                    continue;
                const conflictOff = offs.some(o => !(end <= o.startsAt || start >= o.endsAt));
                if (conflictOff)
                    continue;
                slots.push(start.toISOString());
            }
            this.logger.info('Slots generated', { ctx: 'appointments.slots', orgId, dateISO, count: slots.length });
            return slots;
        });
    }
};
exports.AppointmentsService = AppointmentsService;
exports.AppointmentsService = AppointmentsService = __decorate([
    (0, common_1.Injectable)({ scope: common_1.Scope.REQUEST }),
    __param(1, (0, common_1.Inject)(core_1.REQUEST)),
    __param(2, (0, common_2.Inject)(nest_winston_1.WINSTON_MODULE_PROVIDER)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object, Function])
], AppointmentsService);
//# sourceMappingURL=appointments.service.js.map