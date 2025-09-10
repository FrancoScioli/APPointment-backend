import { Body, Controller, HttpCode, Post, UsePipes, ValidationPipe } from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import { SendBookingConfirmationDto } from './dto/send-booking-confirmation.dto'
import { SendBookingReminderDto } from './dto/send-booking-reminder.dto'
import { SendBookingCanceledDto } from './dto/send-booking-canceled.dto'

/**
 * Controlador para disparar notificaciones manualmente (admin/debug).
 * Podés proteger estas rutas con guardias/roles al integrarlas.
 */
@Controller('notifications')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post('booking-confirmation')
  @HttpCode(204)
  async bookingConfirmation(@Body() dto: SendBookingConfirmationDto) {
    await this.notifications.sendBookingConfirmation(dto.appointmentId)
  }

  @Post('booking-reminder')
  @HttpCode(204)
  async bookingReminder(@Body() dto: SendBookingReminderDto) {
    await this.notifications.sendBookingReminder(dto.appointmentId, dto.hoursBefore)
  }

  @Post('booking-canceled')
  @HttpCode(204)
  async bookingCanceled(@Body() dto: SendBookingCanceledDto) {
    await this.notifications.sendBookingCanceled(dto.appointmentId, dto.canceledBy, dto.reason)
  }
}
