import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { TenancyModule } from './tenancy/tenancy.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { PlansModule } from './plans/plans.module';
import { BillingModule } from './billing/billing.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CalendarsModule } from './calendars/calendars.module';
import { LoggingModule } from './logging/logging.module'
import { CommonModule } from './common/common.module'
import { PublicAppointmentsModule } from './public-appointments/public-appointments.module';


@Module({
  imports: [PrismaModule, TenancyModule, AuthModule, UsersModule, OrganizationsModule, PlansModule, BillingModule, AppointmentsModule, NotificationsModule, CalendarsModule, LoggingModule, CommonModule, PublicAppointmentsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    const { TenancyMiddleware } = require('./tenancy/tenancy.middleware')
    consumer.apply(TenancyMiddleware).forRoutes('*')
  }
}