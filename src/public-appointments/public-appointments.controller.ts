import { Body, Controller, HttpCode, Post, BadRequestException, Inject } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { AppointmentsService } from '../appointments/appointments.service'
import { PublicBookDto } from './dto/public-book.dto'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import type { Logger } from 'winston'

@Controller('public/appointments')
export class PublicAppointmentsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly appointments: AppointmentsService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  /**
   * Crea un turno público:
   * - Upsert del Customer dentro del tenant actual.
   * - Reserva del slot usando AppointmentsService.book (con validacion de solapamientos).
   * - Loguea evento (ok/falla) y devuelve datos mínimos de confirmación.
   *
   * Requiere que el TenancyMiddleware haya seteado organizationId (subdominio o header x-org-id).
   */
  @Post()
  @HttpCode(201)
  async create(@Body() dto: PublicBookDto) {
    if (!dto.email && !dto.phone) {
      this.logger.warn('Public booking: missing contact', { ctx: 'public.book' })
      throw new BadRequestException('Debes enviar email o phone')
    }

    // Tenancy (el service también valida, pero lo usamos aca para upsert del cliente)
    const orgId = (this.appointments as any).req?.organizationId
    if (!orgId) throw new BadRequestException('Tenant required')

    // Idempotencia simple (opcional): si mandan idempotencyKey y ya existe el turno con ese ID, devolvemos
    if (dto.idempotencyKey) {
      const found = await this.prisma.appointment.findUnique({ where: { id: dto.idempotencyKey } }).catch(() => null)
      if (found) {
        this.logger.info('Public booking idempotent hit', { ctx: 'public.book', id: found.id })
        return { id: found.id, startsAt: found.startsAt, status: found.status }
      }
    }

    // Upsert del cliente dentro del tenant
    const customer = await this.prisma.withOrg(orgId, async (tx) => {
      const criteria = dto.email ? { email: dto.email } : { phone: dto.phone! }
      const existing = await tx.customer.findFirst({ where: criteria })
      if (existing) {
        if (existing.name !== dto.name) {
          await tx.customer.update({ where: { id: existing.id }, data: { name: dto.name } })
        }
        return existing
      }
      return tx.customer.create({
        data: {organizationId: orgId, name: dto.name, email: dto.email ?? null, phone: dto.phone ?? null },
      })
    })

    try {
      // Reserva usando la lógica central (valida solapamientos y calcula endsAt)
      const appt = await this.appointments.book({
        organizationId: orgId,
        locationId: dto.locationId,
        serviceId: dto.serviceId,
        staffId: dto.staffId,
        customerId: customer.id,
        startsAt: new Date(dto.startsAt),
      })

      // Si quisieras usar idempotencyKey como ID del turno, podrías actualizarlo aquí mediante un update (no imprescindible).
      this.logger.info('Public booking OK', {
        ctx: 'public.book',
        orgId,
        appointmentId: appt.id,
        serviceId: dto.serviceId,
        staffId: dto.staffId,
      })

      return { id: appt.id, startsAt: appt.startsAt, status: appt.status }
    } catch (e: any) {
      this.logger.warn('Public booking FAILED', {
        ctx: 'public.book',
        orgId,
        err: e?.message,
        serviceId: dto.serviceId,
        staffId: dto.staffId,
        startsAt: dto.startsAt,
      })
      throw e
    }
  }
}
