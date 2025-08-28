import { Module, Global } from '@nestjs/common'
import { WinstonModule } from 'nest-winston'
import * as winston from 'winston'
import 'winston-daily-rotate-file'

const isProd = process.env.NODE_ENV === 'production'

const consoleTransport = new winston.transports.Console({
  level: isProd ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.colorize({ all: !isProd }),
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, ...meta }) =>
      `[${timestamp}] ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`,
    ),
  ),
})

const fileTransport = new (winston.transports as any).DailyRotateFile({
  dirname: 'logs',
  filename: 'app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxFiles: '30d',
  maxSize: '20m',
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
})

@Global()
@Module({
  imports: [
    WinstonModule.forRoot({
      transports: isProd ? [fileTransport, consoleTransport] : [consoleTransport],
      // defaultMeta: { service: 'appointment-backend' },
    }),
  ],
  exports: [WinstonModule],
})
export class LoggingModule {}
