import { Module } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { LoggingModule } from 'src/logging/logging.module';

@Module({
  imports: [NotificationsModule, PrismaModule, LoggingModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService]
})
export class AppointmentsModule {}
