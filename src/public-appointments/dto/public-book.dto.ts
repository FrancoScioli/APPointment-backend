import { IsISO8601, IsOptional, IsString, IsUUID, ValidateIf } from 'class-validator'

/**
 * DTO para crear un turno público (landing/widget).
 * Requiere servicio, staff y sede; permite identificar al cliente por email o teléfono.
 * El campo startsAt debe ser ISO 8601 en UTC (ej: "2025-08-21T12:00:00Z").
 */
export class PublicBookDto {
  @IsUUID() locationId!: string
  @IsUUID() serviceId!: string
  @IsUUID() staffId!: string

  @IsISO8601() startsAt!: string  // ISO 8601 (UTC)

  // Datos del cliente (uno de los dos es obligatorio)
  @IsString() name!: string

  @ValidateIf((o) => !o.phone) @IsString() @IsOptional()
  email?: string

  @ValidateIf((o) => !o.email) @IsString() @IsOptional()
  phone?: string

  // Idempotencia opcional para evitar doble click
  @IsString() @IsOptional()
  idempotencyKey?: string
}
