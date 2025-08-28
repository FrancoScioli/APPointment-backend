"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./prisma/prisma.module");
const tenancy_module_1 = require("./tenancy/tenancy.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const organizations_module_1 = require("./organizations/organizations.module");
const plans_module_1 = require("./plans/plans.module");
const billing_module_1 = require("./billing/billing.module");
const appointments_module_1 = require("./appointments/appointments.module");
const notifications_module_1 = require("./notifications/notifications.module");
const calendars_module_1 = require("./calendars/calendars.module");
const logging_module_1 = require("./logging/logging.module");
const common_module_1 = require("./common/common.module");
const public_appointments_module_1 = require("./public-appointments/public-appointments.module");
let AppModule = class AppModule {
    configure(consumer) {
        const { TenancyMiddleware } = require('./tenancy/tenancy.middleware');
        consumer.apply(TenancyMiddleware).forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, tenancy_module_1.TenancyModule, auth_module_1.AuthModule, users_module_1.UsersModule, organizations_module_1.OrganizationsModule, plans_module_1.PlansModule, billing_module_1.BillingModule, appointments_module_1.AppointmentsModule, notifications_module_1.NotificationsModule, calendars_module_1.CalendarsModule, logging_module_1.LoggingModule, common_module_1.CommonModule, public_appointments_module_1.PublicAppointmentsModule],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map