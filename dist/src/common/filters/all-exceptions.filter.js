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
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const winston_1 = require("winston");
const nest_winston_1 = require("nest-winston");
const common_2 = require("@nestjs/common");
let AllExceptionsFilter = class AllExceptionsFilter {
    constructor(prisma, logger) {
        this.prisma = prisma;
        this.logger = logger;
    }
    async catch(exception, host) {
        const ctx = host.switchToHttp();
        const req = ctx.getRequest();
        const res = ctx.getResponse();
        const isHttp = exception instanceof common_1.HttpException;
        const status = isHttp
            ? exception.getStatus()
            : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const message = isHttp
            ? exception.message
            : exception?.message ?? 'Internal server error';
        const stack = exception?.stack;
        // filtro data sensible
        const safeBody = (() => {
            const clone = { ...req.body };
            delete clone.password;
            delete clone.token;
            delete clone.access_token;
            delete clone.refresh_token;
            return clone;
        })();
        const payload = {
            level: status >= 500 ? 'error' : 'warn',
            message,
            stack,
            route: req.originalUrl,
            method: req.method,
            statusCode: status,
            userId: req?.user?.id ?? null,
            organizationId: req?.organizationId ?? null,
            context: {
                query: req.query,
                params: req.params,
                body: safeBody,
                headers: {
                    'user-agent': req.headers['user-agent'],
                    'x-request-id': req.headers['x-request-id'],
                },
            },
        };
        if (status >= 500) {
            this.logger.error(payload.message, payload);
        }
        else {
            this.logger.warn(payload.message, payload);
        }
        // filtro logs
        if (status >= 500) {
            try {
                await this.prisma.errorLog.create({
                    data: {
                        level: payload.level,
                        message: payload.message,
                        stack: payload.stack,
                        route: payload.route,
                        method: payload.method,
                        statusCode: payload.statusCode ?? null,
                        userId: payload.userId ?? null,
                        organizationId: payload.organizationId ?? null,
                        context: payload.context,
                    },
                });
            }
            catch (persistErr) {
                // si falla el guardado del error, no interrumpimos la respuesta
                this.logger.error('Failed to persist errorLog', { err: persistErr?.message });
            }
        }
        const responseBody = isHttp
            ? exception.getResponse()
            : { statusCode: status, message: 'Internal server error' };
        res.status(status).json(responseBody);
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = __decorate([
    (0, common_1.Catch)(),
    (0, common_1.Injectable)(),
    __param(1, (0, common_2.Inject)(nest_winston_1.WINSTON_MODULE_PROVIDER)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        winston_1.Logger])
], AllExceptionsFilter);
//# sourceMappingURL=all-exceptions.filter.js.map