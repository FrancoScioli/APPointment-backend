import { Injectable, Inject } from '@nestjs/common';
import { IWhatsAppChannel } from './notification-channel';
import { WhatsAppMessage } from '../templates/notification-templates';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import type { Logger } from 'winston'

// Placeholder simple. Podés integrar Twilio WhatsApp API o Meta WhatsApp Cloud API.
@Injectable()
export class WhatsAppChannel implements IWhatsAppChannel {
  constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) {}

  async send(msg: WhatsAppMessage): Promise<void> {
    this.logger.info('WhatsAppChannel → Sending WhatsApp', { to: msg.to });
    // TODO: integración real con tu proveedor
  }
}
