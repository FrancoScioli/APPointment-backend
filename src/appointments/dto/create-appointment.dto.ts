import { IsISO8601, IsOptional, IsString, IsUUID } from 'class-validator'

export class CreateAppointmentDto {
  // En endpoints internos tomamos el org del middleware; esto es opcional como fallback
  @IsUUID()
  @IsOptional()
  organizationId?: string

  @IsUUID()
  @IsString()
  locationId!: string

  @IsUUID()
  @IsString()
  serviceId!: string

  @IsUUID()
  @IsString()
  staffId!: string

  @IsUUID()
  @IsString()
  customerId!: string

  // ISO 8601: "2025-08-22T14:00:00Z"
  @IsISO8601()
  startsAt!: string
}
