// src/notifications/channels/email.channel.ts
import { Injectable, Inject } from '@nestjs/common'
import { IEmailChannel } from './notification-channel'
import { EmailMessage } from '../templates/notification-templates'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import type { Logger } from 'winston'

@Injectable()
export class EmailChannel implements IEmailChannel {
  constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) {}

  async send(msg: EmailMessage): Promise<void> {
    this.logger.info('EmailChannel → Sending email', { to: msg.to, subject: msg.subject })
  }
}
