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
exports.PublicAppointmentsController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const appointments_service_1 = require("../appointments/appointments.service");
const public_book_dto_1 = require("./dto/public-book.dto");
const nest_winston_1 = require("nest-winston");
let PublicAppointmentsController = class PublicAppointmentsController {
    constructor(prisma, appointments, logger) {
        this.prisma = prisma;
        this.appointments = appointments;
        this.logger = logger;
    }
    /**
     * Crea un turno público:
     * - Upsert del Customer dentro del tenant actual.
     * - Reserva del slot usando AppointmentsService.book (con validacion de solapamientos).
     * - Loguea evento (ok/falla) y devuelve datos mínimos de confirmación.
     *
     * Requiere que el TenancyMiddleware haya seteado organizationId (subdominio o header x-org-id).
     */
    async create(dto) {
        if (!dto.email && !dto.phone) {
            this.logger.warn('Public booking: missing contact', { ctx: 'public.book' });
            throw new common_1.BadRequestException('Debes enviar email o phone');
        }
        // Tenancy (el service también valida, pero lo usamos aca para upsert del cliente)
        const orgId = this.appointments.req?.organizationId;
        if (!orgId)
            throw new common_1.BadRequestException('Tenant required');
        // Idempotencia simple (opcional): si mandan idempotencyKey y ya existe el turno con ese ID, devolvemos
        if (dto.idempotencyKey) {
            const found = await this.prisma.appointment.findUnique({ where: { id: dto.idempotencyKey } }).catch(() => null);
            if (found) {
                this.logger.info('Public booking idempotent hit', { ctx: 'public.book', id: found.id });
                return { id: found.id, startsAt: found.startsAt, status: found.status };
            }
        }
        // Upsert del cliente dentro del tenant
        const customer = await this.prisma.withOrg(orgId, async (tx) => {
            const criteria = dto.email ? { email: dto.email } : { phone: dto.phone };
            const existing = await tx.customer.findFirst({ where: criteria });
            if (existing) {
                if (existing.name !== dto.name) {
                    await tx.customer.update({ where: { id: existing.id }, data: { name: dto.name } });
                }
                return existing;
            }
            return tx.customer.create({
                data: { organizationId: orgId, name: dto.name, email: dto.email ?? null, phone: dto.phone ?? null },
            });
        });
        try {
            // Reserva usando la lógica central (valida solapamientos y calcula endsAt)
            const appt = await this.appointments.book({
                organizationId: orgId,
                locationId: dto.locationId,
                serviceId: dto.serviceId,
                staffId: dto.staffId,
                customerId: customer.id,
                startsAt: new Date(dto.startsAt),
            });
            // Si quisieras usar idempotencyKey como ID del turno, podrías actualizarlo aquí mediante un update (no imprescindible).
            this.logger.info('Public booking OK', {
                ctx: 'public.book',
                orgId,
                appointmentId: appt.id,
                serviceId: dto.serviceId,
                staffId: dto.staffId,
            });
            return { id: appt.id, startsAt: appt.startsAt, status: appt.status };
        }
        catch (e) {
            this.logger.warn('Public booking FAILED', {
                ctx: 'public.book',
                orgId,
                err: e?.message,
                serviceId: dto.serviceId,
                staffId: dto.staffId,
                startsAt: dto.startsAt,
            });
            throw e;
        }
    }
};
exports.PublicAppointmentsController = PublicAppointmentsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(201),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [public_book_dto_1.PublicBookDto]),
    __metadata("design:returntype", Promise)
], PublicAppointmentsController.prototype, "create", null);
exports.PublicAppointmentsController = PublicAppointmentsController = __decorate([
    (0, common_1.Controller)('public/appointments'),
    __param(2, (0, common_1.Inject)(nest_winston_1.WINSTON_MODULE_PROVIDER)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        appointments_service_1.AppointmentsService, Function])
], PublicAppointmentsController);
//# sourceMappingURL=public-appointments.controller.js.map