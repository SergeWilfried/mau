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
exports.TransactionsController = void 0;
const common_1 = require("@nestjs/common");
let TransactionsController = class TransactionsController {
    getTransactions(accountId, type, from, to, limit = 20, offset = 0) {
        return {
            transactions: [
                {
                    id: '1',
                    type: 'transfer_in',
                    amount: 100.0,
                    currency: 'EUR',
                    description: 'Payment from John',
                    createdAt: '2024-01-15T10:00:00Z',
                    status: 'completed',
                },
            ],
            total: 1,
            limit,
            offset,
        };
    }
    getTransaction(transactionId) {
        return {
            id: transactionId,
            type: 'transfer_out',
            amount: 50.0,
            currency: 'EUR',
            description: 'Payment to Jane',
            createdAt: '2024-01-15T10:00:00Z',
            status: 'completed',
            fee: 0,
            exchangeRate: null,
            sender: { name: 'John Doe', accountId: '1' },
            recipient: { name: 'Jane Doe', iban: 'GB00BANK00000000002' },
            reference: 'REF123456',
        };
    }
    getPendingTransactions() {
        return { transactions: [] };
    }
    searchTransactions(query, limit = 20) {
        return { transactions: [], query, limit };
    }
    getSpendingByCategory(from, to) {
        return {
            categories: [
                { name: 'Food & Drink', amount: 250.0, percentage: 25 },
                { name: 'Transport', amount: 100.0, percentage: 10 },
                { name: 'Shopping', amount: 150.0, percentage: 15 },
            ],
        };
    }
    getSpendingSummary(from, to, currency = 'EUR') {
        return {
            totalIncome: 5000.0,
            totalExpenses: 3000.0,
            netBalance: 2000.0,
            currency,
        };
    }
};
exports.TransactionsController = TransactionsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('accountId')),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Query)('from')),
    __param(3, (0, common_1.Query)('to')),
    __param(4, (0, common_1.Query)('limit')),
    __param(5, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Number, Number]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "getTransactions", null);
__decorate([
    (0, common_1.Get)(':transactionId'),
    __param(0, (0, common_1.Param)('transactionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "getTransaction", null);
__decorate([
    (0, common_1.Get)('status/pending'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "getPendingTransactions", null);
__decorate([
    (0, common_1.Get)('search/query'),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "searchTransactions", null);
__decorate([
    (0, common_1.Get)('analytics/categories'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "getSpendingByCategory", null);
__decorate([
    (0, common_1.Get)('analytics/summary'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('currency')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "getSpendingSummary", null);
exports.TransactionsController = TransactionsController = __decorate([
    (0, common_1.Controller)('transactions')
], TransactionsController);
//# sourceMappingURL=transactions.controller.js.map