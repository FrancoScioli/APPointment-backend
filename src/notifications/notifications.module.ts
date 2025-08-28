import { Module } from '@nestjs/common';
import { MailService } from './mail/mail.service';
import { WhatsappService } from './whatsapp/whatsapp.service';

@Module({
  providers: [MailService, WhatsappService]
})
export class NotificationsModule {}
