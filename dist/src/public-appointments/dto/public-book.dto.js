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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicBookDto = void 0;
const class_validator_1 = require("class-validator");
/**
 * DTO para crear un turno público (landing/widget).
 * Requiere servicio, staff y sede; permite identificar al cliente por email o teléfono.
 * El campo startsAt debe ser ISO 8601 en UTC (ej: "2025-08-21T12:00:00Z").
 */
class PublicBookDto {
}
exports.PublicBookDto = PublicBookDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], PublicBookDto.prototype, "locationId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], PublicBookDto.prototype, "serviceId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], PublicBookDto.prototype, "staffId", void 0);
__decorate([
    (0, class_validator_1.IsISO8601)(),
    __metadata("design:type", String)
], PublicBookDto.prototype, "startsAt", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PublicBookDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => !o.phone),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PublicBookDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => !o.email),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PublicBookDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PublicBookDto.prototype, "idempotencyKey", void 0);
//# sourceMappingURL=public-book.dto.js.map