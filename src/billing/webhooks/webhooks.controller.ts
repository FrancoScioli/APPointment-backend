import { Body, Controller, HttpCode, Post } from '@nestjs/common'
import { Logger } from 'winston'
import { Inject } from '@nestjs/common'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import { PrismaService } from 'src/prisma/prisma.service'
import { MpService } from '../mp/mp.service'

@Controller('billing')
export class WebhooksController {
  constructor(
    private prisma: PrismaService,
    private mp: MpService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  @Post('webhooks/mp')
  @HttpCode(200)
  async handleMp(@Body() body: any) {
    try {
      const preapprovalId = body?.data?.id || body?.id
      if (!preapprovalId) {
        this.logger.warn('MP webhook without preapproval id', { body })
        return { ok: true }
      }

      const pre = await this.mp.getSubscription(preapprovalId)

      await this.prisma.subscription.updateMany({
        where: { provider: 'MP', providerRef: preapprovalId },
        data: { status: pre.status ?? 'unknown' },
      })

      this.logger.info('MP webhook processed', { preapprovalId, status: pre.status })
      return { ok: true }
    } catch (e: any) {

      this.logger.error('MP webhook failed', { error: e.message })
      return { ok: true }
    }
  }
}
