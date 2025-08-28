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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MpService = void 0;
const axios_1 = __importDefault(require("axios"));
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
const nest_winston_1 = require("nest-winston");
const MP_BASE = 'https://api.mercadopago.com';
let MpService = class MpService {
    constructor(logger) {
        this.logger = logger;
        this.token = process.env.MP_ACCESS_TOKEN;
        this.headers = { Authorization: `Bearer ${this.token}` };
        axios_1.default.interceptors.response.use(undefined, (err) => {
            // Logueamos de forma uniforme los errores de MP
            this.logger.error('MP API error', {
                ctx: 'mp.api',
                url: err.config?.url,
                method: err.config?.method,
                status: err.response?.status,
                data: err.response?.data,
                message: err.message,
            });
            return Promise.reject(err);
        });
    }
    async createPlan(input) {
        const { data } = await axios_1.default.post(`${MP_BASE}/preapproval_plan`, input, { headers: this.headers });
        this.logger.info('MP plan created', { ctx: 'mp.createPlan', id: data?.id, reason: input.reason });
        return data;
    }
    async createSubscription(preapproval) {
        const { data } = await axios_1.default.post(`${MP_BASE}/preapproval`, preapproval, { headers: this.headers });
        this.logger.info('MP subscription created', {
            ctx: 'mp.createSubscription', id: data?.id, plan: preapproval.preapproval_plan_id
        });
        return data;
    }
    async getSubscription(id) {
        const { data } = await axios_1.default.get(`${MP_BASE}/preapproval/${id}`, { headers: this.headers });
        this.logger.info('MP subscription fetched', { ctx: 'mp.getSubscription', id });
        return data;
    }
};
exports.MpService = MpService;
exports.MpService = MpService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_2.Inject)(nest_winston_1.WINSTON_MODULE_PROVIDER)),
    __metadata("design:paramtypes", [Function])
], MpService);
//# sourceMappingURL=mp.service.js.map