import { Module } from '@nestjs/common'
import { PlansService } from './plans.service'
import { PlansController } from './plans.controller'
import { BillingModule } from '../billing/billing.module'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule, BillingModule],
  controllers: [PlansController],
  providers: [PlansService],
})
export class PlansModule {}
