import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, BadRequestException } from '@nestjs/common'
import { AppointmentsService } from './appointments.service'
import { CreateAppointmentDto } from './dto/create-appointment.dto'
import { RequireTenantGuard } from '../tenancy/require-tenant.guard'
import { ParseUUIDPipe } from '@nestjs/common'

@Controller('appointments')
@UseGuards(RequireTenantGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) { }

  @Get('slots')
  slots(@Query() q: { date: string; serviceId: string; staffId?: string; locationId: string }) {
    if (!q?.date || !q?.serviceId || !q?.locationId) {
      throw new BadRequestException('Parámetros requeridos: date, serviceId, locationId')
    }
    return this.appointmentsService.getSlots(q.date, q.serviceId, q.staffId, q.locationId)
  }

  @Post()
  create(@Body() dto: CreateAppointmentDto) {
    // El service.create ya acepta este shape (ver paso 3 si no)
    return this.appointmentsService.create(dto)
  }

  @Get()
  findAll() {
    return this.appointmentsService.findAll()
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.appointmentsService.findOne(id)
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() data: Partial<{ status: string; startsAt: string }>
  ) {
    return this.appointmentsService.update(id, data)
  }

  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.appointmentsService.remove(id)
  }
}
