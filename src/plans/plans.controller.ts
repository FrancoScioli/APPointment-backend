import { Body, Controller, Get, Post, BadRequestException } from '@nestjs/common'
import { PlansService } from './plans.service'
import { PrismaService } from '../prisma/prisma.service'
import { MpService } from '../billing/mp/mp.service'
import { Inject } from '@nestjs/common'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import type { Logger } from 'winston'

@Controller('plans')
export class PlansController {
  constructor(
    private readonly plansService: PlansService,
    private readonly prisma: PrismaService,
    private readonly mp: MpService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  @Get()
  findAll() {
    return this.plansService.findPublicCatalog()
  }

  @Post('checkout')
  async checkout(@Body() dto: { planCode: string; payerEmail: string }) {
    try {
      if (!dto?.planCode || !dto?.payerEmail) throw new BadRequestException('Datos incompletos')

      const plan = await this.prisma.planCatalog.findUnique({ where: { code: dto.planCode } })
      if (!plan) throw new BadRequestException('Plan no encontrado')

      const org = await this.prisma.organization.upsert({
        where: { subdomain: 'demo' },
        update: {},
        create: { name: 'Demo Org', subdomain: 'demo' },
      })

      const mpPlan = await this.mp.createPlan({
        reason: plan.name,
        frequency_type: 'months',
        frequency: 1,
        transaction_amount: Number(plan.price),
        currency_id: (plan.currency as 'ARS' | 'USD') ?? 'ARS',
        trial_period_days: 14,
      })

      const pre = await this.mp.createSubscription({
        preapproval_plan_id: mpPlan.id,
        payer_email: dto.payerEmail,
        back_url: process.env.PUBLIC_URL + '/checkout/success',
      })

      await this.prisma.subscription.create({
        data: {
          organizationId: org.id,
          planId: plan.id,
          provider: 'MP',
          providerRef: pre.id,
          status: pre.status ?? 'pending',
        },
      })

      this.logger.info('Checkout OK', {
        ctx: 'plans.checkout',
        planCode: dto.planCode,
        payerEmail: maskEmail(dto.payerEmail),
        preapprovalId: pre.id,
      });

      return { subscriptionId: pre.id, status: pre.status }
    } catch (e: any) {
      // El filtro global va a persistir el error 5xx en DB; acá agregamos contexto útil
      this.logger.error('Checkout FAILED', {
        ctx: 'plans.checkout',
        planCode: dto?.planCode,
        payerEmail: dto?.payerEmail ? maskEmail(dto.payerEmail) : undefined,
        err: e?.message,
      })
      throw e;
    }
  }
}

// helper simple para no loguear emails completos
function maskEmail(email: string) {
  const [u, d] = email.split('@')
  return `${u?.slice(0,2)}***@${d}`
}
