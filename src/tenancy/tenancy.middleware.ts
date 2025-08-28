import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common'
import { NextFunction, Request, Response } from 'express'
import { TenancyService } from './tenancy.service'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import { Inject } from '@nestjs/common'
import { Logger } from 'winston'

function parseSubdomain(host?: string, baseDomain?: string): string | null {
  if (!host) return null
  const cleanHost = host.split(':')[0].toLowerCase()
  // si hay baseDomain, quítalo del final
  if (baseDomain && cleanHost.endsWith(baseDomain)) {
    const left = cleanHost.slice(0, -baseDomain.length).replace(/\.$/, '')
    if (!left) return null
    // soportar multi-nivel: foo.bar.tuapp.com => tomamos el label más a la izquierda
    const labels = left.split('.').filter(Boolean)
    return labels[labels.length - 1] || null
  }
  // localhost y dev: tomar el primer label
  const labels = cleanHost.split('.')
  // ej localhost => null; acme.localhost => acme
  if (labels.length >= 2 && labels[0] !== 'localhost') return labels[0]
  return null
}

@Injectable()
export class TenancyMiddleware implements NestMiddleware {
  private baseDomain = process.env.BASE_DOMAIN?.toLowerCase()
  private allowHeader = (process.env.ALLOW_HEADER_TENANCY || 'true').toLowerCase() === 'true'

  constructor(
    private tenancy: TenancyService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // 1) Intentar por subdominio
      const sub = parseSubdomain(req.headers.host, this.baseDomain)
      let organizationId: string | undefined

      if (sub) {
        try {
          organizationId = await this.tenancy.getOrgIdBySubdomain(sub)
          req.subdomain = sub
        } catch (e) {
          // si viene subdominio pero no existe, lo logueamos como warn y devolvemos 400
          this.logger.warn('Unknown subdomain', { sub, path: req.originalUrl })
          throw new BadRequestException('Tenant (subdomain) not recognized')
        }
      }

      // 2) Fallback por header (solo dev/testing)
      if (!organizationId && this.allowHeader) {
        const headerOrg = req.header('x-org-id')
        if (headerOrg) {
          try {
            organizationId = await this.tenancy.getOrgIdByIdOrThrow(headerOrg)
            this.logger.debug('Tenancy via header', { orgId: headerOrg })
          } catch (e) {
            this.logger.warn('Header x-org-id invalid', { orgId: headerOrg })
            throw new BadRequestException('Header x-org-id invalid')
          }
        }
      }

      // 3) Si no determinamos tenant, seguimos “sin tenant”.
      //    Para endpoints públicos (p.ej. GET /plans) está OK.
      //    Para endpoints que requieren tenant, pondremos un guard.
      if (organizationId) {
        req.organizationId = organizationId
      }

      next()
    } catch (err) {
      // Dejar que el Global Exception Filter responda
      next(err)
    }
  }
}
