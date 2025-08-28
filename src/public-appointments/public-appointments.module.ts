import { Module } from '@nestjs/common'
import { PublicAppointmentsController } from './public-appointments.controller'
import { PrismaModule } from '../prisma/prisma.module'
import { AppointmentsModule } from '../appointments/appointments.module'

/**
 * Modulo para endpoints publicos relacionados a turnos (booking sin autenticación).
 * Depende de Prisma y reutiliza la logica de AppointmentsService.
 */
@Module({
  imports: [PrismaModule, AppointmentsModule],
  controllers: [PublicAppointmentsController],
})
export class PublicAppointmentsModule {}
