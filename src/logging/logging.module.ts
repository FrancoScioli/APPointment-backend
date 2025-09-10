// src/logging/logging.module.ts
import { Module, Global } from '@nestjs/common'
import { WinstonModule } from 'nest-winston'
import * as winston from 'winston'
import 'winston-daily-rotate-file'

/**
 * LoggingModule
 * --------------
 * Módulo global de logging para toda la aplicación.
 * - Usa Winston como logger principal.
 * - En desarrollo: solo consola, con color y formato legible.
 * - En producción: rota archivos diarios + consola.
 * - Se inyecta usando el token WINSTON_MODULE_PROVIDER.
 */

const isProd = process.env.NODE_ENV === 'production'

/**
 * Transporte de consola (desarrollo y prod).
 */
const consoleTransport = new winston.transports.Console({
  level: isProd ? 'info' : 'debug',
  format: winston.format.combine(
    // Colorea la salida solo en dev
    winston.format.colorize({ all: !isProd }),
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const metaString = Object.keys(meta).length ? JSON.stringify(meta) : ''
      return `[${timestamp}] ${level}: ${message} ${metaString}`
    }),
  ),
})

/**
 * Transporte de archivo con rotación diaria (solo prod).
 */
const fileTransport = new (winston.transports as any).DailyRotateFile({
  dirname: 'logs',              // carpeta destino
  filename: 'app-%DATE%.log',   // nombre con fecha
  datePattern: 'YYYY-MM-DD',    // formato de fecha en nombre
  zippedArchive: true,          // comprime logs viejos
  maxFiles: '30d',              // retiene 30 días
  maxSize: '20m',               // rota si pasa de 20 MB
  level: 'info',                // nivel mínimo guardado en archivo
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
})

@Global()
@Module({
  imports: [
    WinstonModule.forRoot({
      // Según entorno, define los transports
      transports: isProd
        ? [fileTransport, consoleTransport]
        : [consoleTransport],
      // Podés agregar defaultMeta si querés identificar el servicio
      // defaultMeta: { service: 'appointment-backend' },
    }),
  ],
  exports: [WinstonModule], // exporta para que el logger esté disponible globalmente
})
export class LoggingModule {}
