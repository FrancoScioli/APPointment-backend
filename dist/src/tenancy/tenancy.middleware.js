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
exports.TenancyMiddleware = void 0;
const common_1 = require("@nestjs/common");
const tenancy_service_1 = require("./tenancy.service");
const nest_winston_1 = require("nest-winston");
const common_2 = require("@nestjs/common");
const winston_1 = require("winston");
function parseSubdomain(host, baseDomain) {
    if (!host)
        return null;
    const cleanHost = host.split(':')[0].toLowerCase();
    // si hay baseDomain, quítalo del final
    if (baseDomain && cleanHost.endsWith(baseDomain)) {
        const left = cleanHost.slice(0, -baseDomain.length).replace(/\.$/, '');
        if (!left)
            return null;
        // soportar multi-nivel: foo.bar.tuapp.com => tomamos el label más a la izquierda
        const labels = left.split('.').filter(Boolean);
        return labels[labels.length - 1] || null;
    }
    // localhost y dev: tomar el primer label
    const labels = cleanHost.split('.');
    // ej localhost => null; acme.localhost => acme
    if (labels.length >= 2 && labels[0] !== 'localhost')
        return labels[0];
    return null;
}
let TenancyMiddleware = class TenancyMiddleware {
    constructor(tenancy, logger) {
        this.tenancy = tenancy;
        this.logger = logger;
        this.baseDomain = process.env.BASE_DOMAIN?.toLowerCase();
        this.allowHeader = (process.env.ALLOW_HEADER_TENANCY || 'true').toLowerCase() === 'true';
    }
    async use(req, res, next) {
        try {
            // 1) Intentar por subdominio
            const sub = parseSubdomain(req.headers.host, this.baseDomain);
            let organizationId;
            if (sub) {
                try {
                    organizationId = await this.tenancy.getOrgIdBySubdomain(sub);
                    req.subdomain = sub;
                }
                catch (e) {
                    // si viene subdominio pero no existe, lo logueamos como warn y devolvemos 400
                    this.logger.warn('Unknown subdomain', { sub, path: req.originalUrl });
                    throw new common_1.BadRequestException('Tenant (subdomain) not recognized');
                }
            }
            // 2) Fallback por header (solo dev/testing)
            if (!organizationId && this.allowHeader) {
                const headerOrg = req.header('x-org-id');
                if (headerOrg) {
                    try {
                        organizationId = await this.tenancy.getOrgIdByIdOrThrow(headerOrg);
                        this.logger.debug('Tenancy via header', { orgId: headerOrg });
                    }
                    catch (e) {
                        this.logger.warn('Header x-org-id invalid', { orgId: headerOrg });
                        throw new common_1.BadRequestException('Header x-org-id invalid');
                    }
                }
            }
            // 3) Si no determinamos tenant, seguimos “sin tenant”.
            //    Para endpoints públicos (p.ej. GET /plans) está OK.
            //    Para endpoints que requieren tenant, pondremos un guard.
            if (organizationId) {
                req.organizationId = organizationId;
            }
            next();
        }
        catch (err) {
            // Dejar que el Global Exception Filter responda
            next(err);
        }
    }
};
exports.TenancyMiddleware = TenancyMiddleware;
exports.TenancyMiddleware = TenancyMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_2.Inject)(nest_winston_1.WINSTON_MODULE_PROVIDER)),
    __metadata("design:paramtypes", [tenancy_service_1.TenancyService,
        winston_1.Logger])
], TenancyMiddleware);
//# sourceMappingURL=tenancy.middleware.js.map