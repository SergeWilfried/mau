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
exports.BeneficiariesController = void 0;
const common_1 = require("@nestjs/common");
let BeneficiariesController = class BeneficiariesController {
    getBeneficiaries(type, search) {
        return {
            beneficiaries: [
                {
                    id: '1',
                    type: 'bank',
                    name: 'Jane Doe',
                    iban: 'GB00BANK00000000002',
                    bic: 'BANKGB21',
                    currency: 'EUR',
                    isFavorite: true,
                },
            ],
        };
    }
    addBeneficiary(body) {
        return {
            id: '2',
            ...body,
            message: 'Beneficiary added successfully',
        };
    }
    getBeneficiary(id) {
        return {
            id,
            type: 'bank',
            name: 'Jane Doe',
            iban: 'GB00BANK00000000002',
            bic: 'BANKGB21',
            currency: 'EUR',
            bankName: 'Example Bank',
            bankAddress: '123 Bank Street',
            isFavorite: true,
            createdAt: '2024-01-01T00:00:00Z',
        };
    }
    updateBeneficiary(id, body) {
        return { message: 'Beneficiary updated successfully' };
    }
    deleteBeneficiary(id) {
        return { message: 'Beneficiary deleted successfully' };
    }
    markFavorite(id) {
        return { message: 'Beneficiary marked as favorite' };
    }
    removeFavorite(id) {
        return { message: 'Beneficiary removed from favorites' };
    }
    validateIban(body) {
        return {
            valid: true,
            bankName: 'Example Bank',
            bic: 'BANKGB21',
            country: 'GB',
        };
    }
    getRecentBeneficiaries(limit = 5) {
        return { beneficiaries: [] };
    }
};
exports.BeneficiariesController = BeneficiariesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('type')),
    __param(1, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], BeneficiariesController.prototype, "getBeneficiaries", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BeneficiariesController.prototype, "addBeneficiary", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BeneficiariesController.prototype, "getBeneficiary", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BeneficiariesController.prototype, "updateBeneficiary", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BeneficiariesController.prototype, "deleteBeneficiary", null);
__decorate([
    (0, common_1.Post)(':id/favorite'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BeneficiariesController.prototype, "markFavorite", null);
__decorate([
    (0, common_1.Delete)(':id/favorite'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BeneficiariesController.prototype, "removeFavorite", null);
__decorate([
    (0, common_1.Post)('validate-iban'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BeneficiariesController.prototype, "validateIban", null);
__decorate([
    (0, common_1.Get)('list/recent'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], BeneficiariesController.prototype, "getRecentBeneficiaries", null);
exports.BeneficiariesController = BeneficiariesController = __decorate([
    (0, common_1.Controller)('beneficiaries')
], BeneficiariesController);
//# sourceMappingURL=beneficiaries.controller.js.map