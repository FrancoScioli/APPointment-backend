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
exports.WebhooksController = void 0;
const common_1 = require("@nestjs/common");
const winston_1 = require("winston");
const common_2 = require("@nestjs/common");
const nest_winston_1 = require("nest-winston");
const prisma_service_1 = require("../../prisma/prisma.service");
const mp_service_1 = require("../mp/mp.service");
let WebhooksController = class WebhooksController {
    constructor(prisma, mp, logger) {
        this.prisma = prisma;
        this.mp = mp;
        this.logger = logger;
    }
    async handleMp(body) {
        try {
            const preapprovalId = body?.data?.id || body?.id;
            if (!preapprovalId) {
                this.logger.warn('MP webhook without preapproval id', { body });
                return { ok: true };
            }
            const pre = await this.mp.getSubscription(preapprovalId);
            await this.prisma.subscription.updateMany({
                where: { provider: 'MP', providerRef: preapprovalId },
                data: { status: pre.status ?? 'unknown' },
            });
            this.logger.info('MP webhook processed', { preapprovalId, status: pre.status });
            return { ok: true };
        }
        catch (e) {
            this.logger.error('MP webhook failed', { error: e.message });
            return { ok: true };
        }
    }
};
exports.WebhooksController = WebhooksController;
__decorate([
    (0, common_1.Post)('webhooks/mp'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handleMp", null);
exports.WebhooksController = WebhooksController = __decorate([
    (0, common_1.Controller)('billing'),
    __param(2, (0, common_2.Inject)(nest_winston_1.WINSTON_MODULE_PROVIDER)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mp_service_1.MpService,
        winston_1.Logger])
], WebhooksController);
//# sourceMappingURL=webhooks.controller.js.map