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
exports.PayoutsController = void 0;
const common_1 = require("@nestjs/common");
const payouts_service_1 = require("./payouts.service");
const auth_guard_1 = require("../common/guards/auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let PayoutsController = class PayoutsController {
    constructor(payoutsService) {
        this.payoutsService = payoutsService;
    }
    initiateBankPayout(user, body) {
        return this.payoutsService.initiateBankPayout(user.id, body.fromAccountId, {
            beneficiaryId: body.beneficiaryId,
            bankName: body.bankName,
            accountName: body.accountName,
            accountNumber: body.accountNumber,
            iban: body.iban,
            bic: body.bic,
            routingNumber: body.routingNumber,
            country: body.country,
            amount: body.amount,
            currency: body.currency,
            reference: body.reference,
        });
    }
    initiateMobileMoneyPayout(user, body) {
        return this.payoutsService.initiateMobileMoneyPayout(user.id, body.fromAccountId, {
            beneficiaryId: body.beneficiaryId,
            provider: body.provider,
            phone: body.phone,
            recipientName: body.recipientName,
            amount: body.amount,
            currency: body.currency,
            note: body.note,
        });
    }
    getPayouts(user, status, method, limit, offset) {
        return this.payoutsService.getPayouts(user.id, status, method, limit, offset);
    }
    getPayoutQuote(method, amount, currency, country, provider) {
        return this.payoutsService.getPayoutQuote(method, {
            country,
            provider,
            amount: Number(amount),
            currency,
        });
    }
    getPayoutMethods(country) {
        return this.payoutsService.getPayoutMethods(country);
    }
    getPayout(user, payoutId) {
        return this.payoutsService.getPayout(user.id, payoutId);
    }
    cancelPayout(user, payoutId) {
        return this.payoutsService.cancelPayout(user.id, payoutId);
    }
};
exports.PayoutsController = PayoutsController;
__decorate([
    (0, common_1.Post)('bank'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PayoutsController.prototype, "initiateBankPayout", null);
__decorate([
    (0, common_1.Post)('mobile-money'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PayoutsController.prototype, "initiateMobileMoneyPayout", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('method')),
    __param(3, (0, common_1.Query)('limit')),
    __param(4, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Number, Number]),
    __metadata("design:returntype", void 0)
], PayoutsController.prototype, "getPayouts", null);
__decorate([
    (0, common_1.Get)('quote'),
    __param(0, (0, common_1.Query)('method')),
    __param(1, (0, common_1.Query)('amount')),
    __param(2, (0, common_1.Query)('currency')),
    __param(3, (0, common_1.Query)('country')),
    __param(4, (0, common_1.Query)('provider')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, String, String, String]),
    __metadata("design:returntype", void 0)
], PayoutsController.prototype, "getPayoutQuote", null);
__decorate([
    (0, common_1.Get)('methods'),
    __param(0, (0, common_1.Query)('country')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PayoutsController.prototype, "getPayoutMethods", null);
__decorate([
    (0, common_1.Get)(':payoutId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('payoutId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PayoutsController.prototype, "getPayout", null);
__decorate([
    (0, common_1.Post)(':payoutId/cancel'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('payoutId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PayoutsController.prototype, "cancelPayout", null);
exports.PayoutsController = PayoutsController = __decorate([
    (0, common_1.Controller)('payouts'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [payouts_service_1.PayoutsService])
], PayoutsController);
//# sourceMappingURL=payouts.controller.js.map