import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common'
import { Request } from 'express'

@Injectable()
export class RequireTenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>()
    if (!req.organizationId) {
      throw new ForbiddenException('Tenant required')
    }
    return true
  }
}
