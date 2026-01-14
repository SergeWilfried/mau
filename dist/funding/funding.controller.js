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
exports.FundingController = void 0;
const common_1 = require("@nestjs/common");
const funding_service_1 = require("./funding.service");
const auth_guard_1 = require("../common/guards/auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let FundingController = class FundingController {
    constructor(fundingService) {
        this.fundingService = fundingService;
    }
    initiateWireFunding(user, body) {
        return this.fundingService.initiateWireFunding(user.id, body.accountId, body.amount, body.currency);
    }
    initiateCryptoFunding(user, body) {
        return this.fundingService.initiateCryptoFunding(user.id, body.accountId, body.symbol, body.network, body.expectedAmount);
    }
    initiateMobileMoneyFunding(user, body) {
        return this.fundingService.initiateMobileMoneyFunding(user.id, body.accountId, body.provider, body.phone, body.amount, body.currency);
    }
    getFundingRequests(user, status, limit, offset) {
        return this.fundingService.getFundingRequests(user.id, status, limit, offset);
    }
    getFundingRequest(user, fundingId) {
        return this.fundingService.getFundingRequest(user.id, fundingId);
    }
    cancelFundingRequest(user, fundingId) {
        return this.fundingService.cancelFundingRequest(user.id, fundingId);
    }
    getAvailableMethods(country) {
        return {
            methods: [
                {
                    id: 'wire',
                    name: 'Wire Transfer',
                    description: 'Bank wire transfer (SEPA/SWIFT)',
                    minAmount: 100,
                    maxAmount: 1000000,
                    fee: 0,
                    estimatedTime: '1-3 business days',
                    currencies: ['EUR', 'USD', 'GBP'],
                },
                {
                    id: 'crypto',
                    name: 'Cryptocurrency',
                    description: 'Deposit crypto and convert to fiat',
                    minAmount: 10,
                    maxAmount: null,
                    fee: 0,
                    estimatedTime: '10-60 minutes',
                    supportedCoins: ['BTC', 'ETH', 'USDT', 'USDC', 'SOL'],
                },
                {
                    id: 'mobile_money',
                    name: 'Mobile Money',
                    description: 'MTN, Orange, M-Pesa, Wave, etc.',
                    minAmount: 1,
                    maxAmount: 5000,
                    fee: 0,
                    estimatedTime: '1-5 minutes',
                    availableCountries: ['CI', 'SN', 'GH', 'KE', 'UG', 'MA'],
                },
            ],
        };
    }
};
exports.FundingController = FundingController;
__decorate([
    (0, common_1.Post)('wire'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], FundingController.prototype, "initiateWireFunding", null);
__decorate([
    (0, common_1.Post)('crypto'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], FundingController.prototype, "initiateCryptoFunding", null);
__decorate([
    (0, common_1.Post)('mobile-money'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], FundingController.prototype, "initiateMobileMoneyFunding", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number, Number]),
    __metadata("design:returntype", void 0)
], FundingController.prototype, "getFundingRequests", null);
__decorate([
    (0, common_1.Get)(':fundingId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('fundingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], FundingController.prototype, "getFundingRequest", null);
__decorate([
    (0, common_1.Post)(':fundingId/cancel'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('fundingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], FundingController.prototype, "cancelFundingRequest", null);
__decorate([
    (0, common_1.Get)('methods/available'),
    __param(0, (0, common_1.Query)('country')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FundingController.prototype, "getAvailableMethods", null);
exports.FundingController = FundingController = __decorate([
    (0, common_1.Controller)('funding'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [funding_service_1.FundingService])
], FundingController);
//# sourceMappingURL=funding.controller.js.map