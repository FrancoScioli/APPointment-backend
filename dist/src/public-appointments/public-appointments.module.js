"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicAppointmentsModule = void 0;
const common_1 = require("@nestjs/common");
const public_appointments_controller_1 = require("./public-appointments.controller");
const prisma_module_1 = require("../prisma/prisma.module");
const appointments_module_1 = require("../appointments/appointments.module");
/**
 * Modulo para endpoints publicos relacionados a turnos (booking sin autenticación).
 * Depende de Prisma y reutiliza la logica de AppointmentsService.
 */
let PublicAppointmentsModule = class PublicAppointmentsModule {
};
exports.PublicAppointmentsModule = PublicAppointmentsModule;
exports.PublicAppointmentsModule = PublicAppointmentsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, appointments_module_1.AppointmentsModule],
        controllers: [public_appointments_controller_1.PublicAppointmentsController],
    })
], PublicAppointmentsModule);
//# sourceMappingURL=public-appointments.module.js.map