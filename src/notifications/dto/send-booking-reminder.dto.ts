import { IsInt, Min, IsString } from 'class-validator'

/** DTO para disparar recordatorio de turno */
export class SendBookingReminderDto {
  @IsString()
  appointmentId!: string

  /** Horas de anticipación para incluir en el texto del recordatorio */
  @IsInt()
  @Min(0)
  hoursBefore!: number
}
