import { Injectable, ForbiddenException, Inject, Scope, BadRequestException } from '@nestjs/common'
import type { Request } from 'express'
import { PrismaService } from '../prisma/prisma.service'
import { addMinutes, setHours, setMinutes, isBefore, isAfter } from 'date-fns'
import { REQUEST } from '@nestjs/core'
import { Inject as Inj } from '@nestjs/common'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import type { Logger } from 'winston'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'


@Injectable({ scope: Scope.REQUEST })
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private readonly req: Request,
    @Inj(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) { }

  async create(dto: {
    organizationId?: string; locationId: string; serviceId: string;
    staffId: string; customerId: string; startsAt: string
  }) {
    return this.book({
      organizationId: dto.organizationId ?? (this.req as any).organizationId,
      locationId: dto.locationId,
      serviceId: dto.serviceId,
      staffId: dto.staffId,
      customerId: dto.customerId,
      startsAt: new Date(dto.startsAt),
    })
  }

  /** Lista los turnos del tenant actual (max 100, orden desc). */
  findAll() {
    const orgId = (this.req as any).organizationId
    if (!orgId) throw new ForbiddenException('Tenant required')
    this.logger.info('List appointments', { ctx: 'appointments.findAll', orgId })
    return this.prisma.withOrg(orgId, tx =>
      tx.appointment.findMany({ take: 100, orderBy: { startsAt: 'desc' } }),
    )
  }

  /**
 * Reserva un turno (core):
 * - Calcula endsAt según duración del servicio
 * - Valida solapamiento por rango (staffId)
 * - Crea Appointment con status CONFIRMED
 */
  async book(params: {
    organizationId: string; locationId: string; serviceId: string;
    staffId: string; customerId: string; startsAt: Date
  }) {
    const orgId = (this.req as any).organizationId ?? params.organizationId
    if (!orgId) throw new ForbiddenException('Tenant required')

    return this.prisma.withOrg(orgId, async (tx) => {
      const service = await tx.service.findUnique({ where: { id: params.serviceId } })
      if (!service) throw new BadRequestException('Servicio no existe')

      const endsAt = addMinutes(params.startsAt, service.durationMin)

      const overlap = await tx.appointment.findFirst({
        where: { staffId: params.staffId, startsAt: { lt: endsAt }, endsAt: { gt: params.startsAt } },
      })
      if (overlap) {
        this.logger.warn('Slot ocupado', {
          ctx: 'appointments.book',
          orgId,
          staffId: params.staffId,
          startsAt: params.startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
        })
        throw new BadRequestException('Slot ocupado')
      }

      const appt = await tx.appointment.create({ data: { ...params, endsAt, status: 'CONFIRMED' } })
      this.logger.info('Appointment created', {
        ctx: 'appointments.book',
        orgId, appointmentId: appt.id, staffId: appt.staffId,
      })
      return appt
    })
  }

  /** Devuelve un turno por ID dentro del tenant actual. */
  async findOne(id: string) {
    const orgId = (this.req as any).organizationId
    if (!orgId) throw new ForbiddenException('Tenant required')

    this.logger.info('Get appointment', { ctx: 'appointments.findOne', orgId, id })

    return this.prisma.withOrg(orgId, (tx) =>
      tx.appointment.findUnique({ where: { id } }),
    )
  }

  /**
 * Actualiza estado y/o horario del turno:
 * - Recalcula endsAt segun service.durationMin si cambia startsAt
 * - Valida solapamientos con otros turnos del mismo staff
 */
  async update(id: string, data: Partial<{ status: string; startsAt: string }>) {
    const orgId = (this.req as any).organizationId
    if (!orgId) throw new ForbiddenException('Tenant required')

    return this.prisma.withOrg(orgId, async (tx) => {
      const patch: any = {}

      if (typeof data.status === 'string') patch.status = data.status

      if (typeof data.startsAt === 'string') {
        const appt = await tx.appointment.findUnique({ where: { id } })
        if (!appt) throw new BadRequestException('Turno inexistente')

        const service = await tx.service.findUnique({ where: { id: appt.serviceId } })
        if (!service) throw new BadRequestException('Servicio no existe')

        const startsAt = new Date(data.startsAt)
        const endsAt = addMinutes(startsAt, service.durationMin)

        // chequear solapamiento
        const overlap = await tx.appointment.findFirst({
          where: {
            id: { not: id },
            staffId: appt.staffId,
            startsAt: { lt: endsAt },
            endsAt: { gt: startsAt },
          },
        })
        if (overlap) {
          this.logger.warn('Slot ocupado (update)', {
            ctx: 'appointments.update',
            orgId, id, staffId: appt.staffId,
            startsAt: startsAt.toISOString(),
            endsAt: endsAt.toISOString(),
          })
          throw new BadRequestException('Slot ocupado')
        }

        patch.startsAt = startsAt
        patch.endsAt = endsAt
      }

      const updated = await tx.appointment.update({ where: { id }, data: patch })
      this.logger.info('Appointment updated', { ctx: 'appointments.update', orgId, id })
      return updated
    })
  }

  /** Elimina un turno del tenant actual y registra el evento en logs. */
  async remove(id: string) {
    const orgId = (this.req as any).organizationId
    if (!orgId) throw new ForbiddenException('Tenant required')

    const deleted = await this.prisma.withOrg(orgId, (tx) =>
      tx.appointment.delete({ where: { id } }),
    )

    this.logger.info('Appointment removed', { ctx: 'appointments.remove', orgId, id })
    return deleted
  }

  /**
 * Calcula slots disponibles para una fecha:
 * - Usa WorkingHours (por staff si existe, si no por location)
 * - Excluye TimeOff (staff o general de la sede)
 * - Excluye solapamientos con citas existentes
 */
  async getSlots(dateISO: string, serviceId: string, staffId: string | undefined, locationId: string) {
    const orgId = (this.req as any).organizationId
    if (!orgId) throw new ForbiddenException('Tenant required')

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) {
      this.logger.warn('Invalid date format', { ctx: 'appointments.slots', dateISO })
      throw new BadRequestException('Formato de fecha inválido (YYYY-MM-DD)')
    }

    return this.prisma.withOrg(orgId, async (tx) => {
      const service = await tx.service.findUnique({ where: { id: serviceId } })
      if (!service) throw new BadRequestException('Servicio no existe')

      const loc = await tx.location.findUnique({ where: { id: locationId } })
      const tz = loc?.timezone || 'UTC'

      // Preparar día local
      const date = new Date(`${dateISO}T00:00:00Z`)
      const localDay = toZonedTime(date, tz)
      const weekday = localDay.getDay()

      // Working hours
      const wh = await tx.workingHours.findFirst({
        where: { locationId, staffId: staffId ?? null, weekday },
      }) || await tx.workingHours.findFirst({
        where: { locationId, staffId: null, weekday },
      })
      if (!wh) {
        this.logger.info('No working hours', { ctx: 'appointments.slots', orgId, weekday })
        return []
      }

      // Construcción ventana
      const localStart = setMinutes(setHours(localDay, Math.floor(wh.startMin / 60)), wh.startMin % 60)
      const localEnd = setMinutes(setHours(localDay, Math.floor(wh.endMin / 60)), wh.endMin % 60)
      const dayStartUtc = fromZonedTime(localStart, tz)
      const dayEndUtc = fromZonedTime(localEnd, tz)

      // Citas existentes
      const existing = await tx.appointment.findMany({
        where: { staffId, startsAt: { gte: dayStartUtc }, endsAt: { lte: dayEndUtc } },
        select: { startsAt: true, endsAt: true },
      })

      // TimeOff
      const offs = await tx.timeOff.findMany({
        where: {
          OR: [{ staffId }, { staffId: null, locationId }],
          AND: [{ startsAt: { lt: dayEndUtc } }, { endsAt: { gt: dayStartUtc } }],
        },
        select: { startsAt: true, endsAt: true },
      })

      const duration = service.durationMin
      const step = 15
      const slots: string[] = []

      for (let start = dayStartUtc; addMinutes(start, duration) <= dayEndUtc; start = addMinutes(start, step)) {
        const end = addMinutes(start, duration)

        const conflictAppt = existing.some(a => !(end <= a.startsAt || start >= a.endsAt))
        if (conflictAppt) continue

        const conflictOff = offs.some(o => !(end <= o.startsAt || start >= o.endsAt))
        if (conflictOff) continue

        slots.push(start.toISOString())
      }

      this.logger.info('Slots generated', { ctx: 'appointments.slots', orgId, dateISO, count: slots.length })
      return slots
    })
  }

}
