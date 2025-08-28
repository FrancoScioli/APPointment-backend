import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class TenancyService {
  private cache = new Map<string, string>() // subdomain -> orgId

  constructor(private prisma: PrismaService) {}

  async getOrgIdBySubdomain(sub: string): Promise<string> {
    const key = sub.toLowerCase()
    const cached = this.cache.get(key)
    if (cached) return cached

    const org = await this.prisma.organization.findFirst({ where: { subdomain: key } })
    if (!org) throw new NotFoundException(`Organization not found for subdomain "${key}"`)
    this.cache.set(key, org.id)
    return org.id
  }

  async getOrgIdByIdOrThrow(id: string): Promise<string> {
    const org = await this.prisma.organization.findUnique({ where: { id } })
    if (!org) throw new NotFoundException(`Organization not found for id "${id}"`)
    return org.id
  }
}
