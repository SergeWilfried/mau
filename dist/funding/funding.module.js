"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FundingModule = void 0;
const common_1 = require("@nestjs/common");
const funding_controller_1 = require("./funding.controller");
const funding_service_1 = require("./funding.service");
const accounts_module_1 = require("../accounts/accounts.module");
const transactions_module_1 = require("../transactions/transactions.module");
let FundingModule = class FundingModule {
};
exports.FundingModule = FundingModule;
exports.FundingModule = FundingModule = __decorate([
    (0, common_1.Module)({
        imports: [accounts_module_1.AccountsModule, transactions_module_1.TransactionsModule],
        controllers: [funding_controller_1.FundingController],
        providers: [funding_service_1.FundingService],
        exports: [funding_service_1.FundingService],
    })
], FundingModule);
//# sourceMappingURL=funding.module.js.map