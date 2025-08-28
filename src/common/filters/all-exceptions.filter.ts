import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { PrismaService } from '../../prisma/prisma.service'
import { Logger } from 'winston'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import { Inject } from '@nestjs/common'

@Catch()
@Injectable()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private prisma: PrismaService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const req = ctx.getRequest<Request>()
    const res = ctx.getResponse<Response>()

    const isHttp = exception instanceof HttpException
    const status = isHttp
      ? (exception as HttpException).getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR

    const message = isHttp
      ? (exception as HttpException).message
      : (exception as any)?.message ?? 'Internal server error'

    const stack = (exception as any)?.stack

    // filtro data sensible
    const safeBody = (() => {
      const clone: any = { ...req.body }
      delete clone.password
      delete clone.token
      delete clone.access_token
      delete clone.refresh_token
      return clone
    })()

    const payload = {
      level: status >= 500 ? 'error' : 'warn',
      message,
      stack,
      route: req.originalUrl,
      method: req.method,
      statusCode: status,
      userId: (req as any)?.user?.id ?? null,
      organizationId: (req as any)?.organizationId ?? null,
      context: {
        query: req.query,
        params: req.params,
        body: safeBody,
        headers: {
          'user-agent': req.headers['user-agent'],
          'x-request-id': req.headers['x-request-id'],
        },
      },
    }

    if (status >= 500) {
      this.logger.error(payload.message, payload)
    } else {
      this.logger.warn(payload.message, payload)
    }

    // filtro logs
    if (status >= 500) {
      try {
        await this.prisma.errorLog.create({
          data: {
            level: payload.level,
            message: payload.message,
            stack: payload.stack,
            route: payload.route,
            method: payload.method,
            statusCode: payload.statusCode ?? null,
            userId: payload.userId ?? null,
            organizationId: payload.organizationId ?? null,
            context: payload.context as any,
          },
        })
      } catch (persistErr) {
        // si falla el guardado del error, no interrumpimos la respuesta
        this.logger.error('Failed to persist errorLog', { err: (persistErr as any)?.message })
      }
    }

    const responseBody = isHttp
      ? (exception as HttpException).getResponse()
      : { statusCode: status, message: 'Internal server error' }

    res.status(status).json(responseBody)
  }
}
