import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  findPublicCatalog() {
    return this.prisma.planCatalog.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
      select: { code: true, name: true, price: true, currency: true, features: true },
    })
  }
}
