"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlansController = void 0;
const common_1 = require("@nestjs/common");
const plans_service_1 = require("./plans.service");
const prisma_service_1 = require("../prisma/prisma.service");
const mp_service_1 = require("../billing/mp/mp.service");
const common_2 = require("@nestjs/common");
const nest_winston_1 = require("nest-winston");
let PlansController = class PlansController {
    constructor(plansService, prisma, mp, logger) {
        this.plansService = plansService;
        this.prisma = prisma;
        this.mp = mp;
        this.logger = logger;
    }
    findAll() {
        return this.plansService.findPublicCatalog();
    }
    async checkout(dto) {
        try {
            if (!dto?.planCode || !dto?.payerEmail)
                throw new common_1.BadRequestException('Datos incompletos');
            const plan = await this.prisma.planCatalog.findUnique({ where: { code: dto.planCode } });
            if (!plan)
                throw new common_1.BadRequestException('Plan no encontrado');
            const org = await this.prisma.organization.upsert({
                where: { subdomain: 'demo' },
                update: {},
                create: { name: 'Demo Org', subdomain: 'demo' },
            });
            const mpPlan = await this.mp.createPlan({
                reason: plan.name,
                frequency_type: 'months',
                frequency: 1,
                transaction_amount: Number(plan.price),
                currency_id: plan.currency ?? 'ARS',
                trial_period_days: 14,
            });
            const pre = await this.mp.createSubscription({
                preapproval_plan_id: mpPlan.id,
                payer_email: dto.payerEmail,
                back_url: process.env.PUBLIC_URL + '/checkout/success',
            });
            await this.prisma.subscription.create({
                data: {
                    organizationId: org.id,
                    planId: plan.id,
                    provider: 'MP',
                    providerRef: pre.id,
                    status: pre.status ?? 'pending',
                },
            });
            this.logger.info('Checkout OK', {
                ctx: 'plans.checkout',
                planCode: dto.planCode,
                payerEmail: maskEmail(dto.payerEmail),
                preapprovalId: pre.id,
            });
            return { subscriptionId: pre.id, status: pre.status };
        }
        catch (e) {
            // El filtro global va a persistir el error 5xx en DB; acá agregamos contexto útil
            this.logger.error('Checkout FAILED', {
                ctx: 'plans.checkout',
                planCode: dto?.planCode,
                payerEmail: dto?.payerEmail ? maskEmail(dto.payerEmail) : undefined,
                err: e?.message,
            });
            throw e;
        }
    }
};
exports.PlansController = PlansController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PlansController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)('checkout'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "checkout", null);
exports.PlansController = PlansController = __decorate([
    (0, common_1.Controller)('plans'),
    __param(3, (0, common_2.Inject)(nest_winston_1.WINSTON_MODULE_PROVIDER)),
    __metadata("design:paramtypes", [plans_service_1.PlansService,
        prisma_service_1.PrismaService,
        mp_service_1.MpService, Function])
], PlansController);
// helper simple para no loguear emails completos
function maskEmail(email) {
    const [u, d] = email.split('@');
    return `${u?.slice(0, 2)}***@${d}`;
}
//# sourceMappingURL=plans.controller.js.map