import { IsIn, IsOptional, IsString } from 'class-validator'

/** DTO para disparar notificación de turno cancelado */
export class SendBookingCanceledDto {
  @IsString()
  appointmentId!: string

  @IsIn(['customer', 'professional', 'system'])
  canceledBy!: 'customer' | 'professional' | 'system'

  @IsOptional()
  @IsString()
  reason?: string
}
