import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { LoggingModule } from '../logging/logging.module'
import { MailService } from './mail/mail.service'
import { WhatsappService } from './whatsapp/whatsapp.service'
import { NotificationsService } from './notifications.service'

/**
 * Modulo de notificaciones. Expone el facade y registra mail y WhatsApp.
 */
@Module({
  imports: [PrismaModule, LoggingModule],
  providers: [MailService, WhatsappService, NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule { }
