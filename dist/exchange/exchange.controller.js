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
exports.ExchangeController = void 0;
const common_1 = require("@nestjs/common");
let ExchangeController = class ExchangeController {
    getRates(base = 'EUR') {
        return {
            base,
            timestamp: new Date().toISOString(),
            rates: {
                USD: 1.08,
                GBP: 0.86,
                MAD: 10.85,
                CHF: 0.94,
                JPY: 162.5,
                CAD: 1.47,
            },
        };
    }
    getRate(from, to, amount) {
        return {
            from,
            to,
            rate: 1.08,
            amount: amount || 1,
            convertedAmount: (amount || 1) * 1.08,
            fee: 0,
            timestamp: new Date().toISOString(),
        };
    }
    convert(body) {
        return {
            transactionId: '200',
            fromAmount: body.fromAmount || 100,
            fromCurrency: 'EUR',
            toAmount: 108,
            toCurrency: 'USD',
            rate: 1.08,
            fee: 0,
            status: 'completed',
        };
    }
    getQuote(body) {
        return {
            fromCurrency: body.fromCurrency,
            toCurrency: body.toCurrency,
            fromAmount: body.fromAmount || 100,
            toAmount: 108,
            rate: 1.08,
            fee: 0,
            expiresAt: new Date(Date.now() + 30000).toISOString(),
            quoteId: 'quote_123',
        };
    }
    executeQuote(body) {
        return {
            transactionId: '201',
            status: 'completed',
            message: 'Exchange completed successfully',
        };
    }
    getSupportedCurrencies() {
        return {
            currencies: [
                { code: 'EUR', name: 'Euro', symbol: '€' },
                { code: 'USD', name: 'US Dollar', symbol: '$' },
                { code: 'GBP', name: 'British Pound', symbol: '£' },
                { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.' },
                { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
                { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
                { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
            ],
        };
    }
    getExchangeHistory(limit = 20, offset = 0) {
        return { exchanges: [], total: 0, limit, offset };
    }
};
exports.ExchangeController = ExchangeController;
__decorate([
    (0, common_1.Get)('rates'),
    __param(0, (0, common_1.Query)('base')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExchangeController.prototype, "getRates", null);
__decorate([
    (0, common_1.Get)('rate'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('amount')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number]),
    __metadata("design:returntype", void 0)
], ExchangeController.prototype, "getRate", null);
__decorate([
    (0, common_1.Post)('convert'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ExchangeController.prototype, "convert", null);
__decorate([
    (0, common_1.Post)('quote'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ExchangeController.prototype, "getQuote", null);
__decorate([
    (0, common_1.Post)('execute'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ExchangeController.prototype, "executeQuote", null);
__decorate([
    (0, common_1.Get)('supported-currencies'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ExchangeController.prototype, "getSupportedCurrencies", null);
__decorate([
    (0, common_1.Get)('history'),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], ExchangeController.prototype, "getExchangeHistory", null);
exports.ExchangeController = ExchangeController = __decorate([
    (0, common_1.Controller)('exchange')
], ExchangeController);
//# sourceMappingURL=exchange.controller.js.map