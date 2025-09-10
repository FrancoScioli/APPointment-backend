import { IsString } from 'class-validator'

/** DTO para disparar confirmación de turno */
export class SendBookingConfirmationDto {
  @IsString()
  appointmentId!: string
}
