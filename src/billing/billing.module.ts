import { Module } from '@nestjs/common'
import { MpService } from './mp/mp.service'
import { WebhooksController } from './webhooks/webhooks.controller' 

@Module({
  providers: [MpService],
  controllers: [WebhooksController],
  exports: [MpService],
})
export class BillingModule {}
