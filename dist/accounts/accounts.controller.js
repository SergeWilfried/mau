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
exports.AccountsController = void 0;
const common_1 = require("@nestjs/common");
let AccountsController = class AccountsController {
    getAccounts() {
        return {
            accounts: [
                { id: '1', currency: 'EUR', balance: 1000.0, isMain: true },
                { id: '2', currency: 'USD', balance: 500.0, isMain: false },
            ],
        };
    }
    createAccount(body) {
        return { id: '3', currency: body.currency, balance: 0, isMain: false };
    }
    getAccount(accountId) {
        return { id: accountId, currency: 'EUR', balance: 1000.0, iban: 'GB00REVO00000000001' };
    }
    getAccountDetails(accountId) {
        return {
            iban: 'GB00REVO00000000001',
            bic: 'REVOGB21',
            accountHolder: 'John Doe',
            bankName: 'DouniPay',
            bankAddress: '123 Finance Street',
        };
    }
    setMainAccount(accountId) {
        return { message: 'Main account updated successfully' };
    }
    getTotalBalance(currency = 'EUR') {
        return { totalBalance: 1500.0, currency };
    }
    getStatements(accountId, from, to) {
        return { statements: [], accountId, from, to };
    }
    exportStatement(accountId, body) {
        return { downloadUrl: 'https://example.com/statement.pdf' };
    }
};
exports.AccountsController = AccountsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AccountsController.prototype, "getAccounts", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AccountsController.prototype, "createAccount", null);
__decorate([
    (0, common_1.Get)(':accountId'),
    __param(0, (0, common_1.Param)('accountId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AccountsController.prototype, "getAccount", null);
__decorate([
    (0, common_1.Get)(':accountId/details'),
    __param(0, (0, common_1.Param)('accountId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AccountsController.prototype, "getAccountDetails", null);
__decorate([
    (0, common_1.Put)(':accountId/main'),
    __param(0, (0, common_1.Param)('accountId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AccountsController.prototype, "setMainAccount", null);
__decorate([
    (0, common_1.Get)('summary/total-balance'),
    __param(0, (0, common_1.Query)('currency')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AccountsController.prototype, "getTotalBalance", null);
__decorate([
    (0, common_1.Get)(':accountId/statements'),
    __param(0, (0, common_1.Param)('accountId')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], AccountsController.prototype, "getStatements", null);
__decorate([
    (0, common_1.Post)(':accountId/statements/export'),
    __param(0, (0, common_1.Param)('accountId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AccountsController.prototype, "exportStatement", null);
exports.AccountsController = AccountsController = __decorate([
    (0, common_1.Controller)('accounts')
], AccountsController);
//# sourceMappingURL=accounts.controller.js.map