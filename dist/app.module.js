"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const supabase_module_1 = require("./supabase/supabase.module");
const common_module_1 = require("./common/common.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const accounts_module_1 = require("./accounts/accounts.module");
const transactions_module_1 = require("./transactions/transactions.module");
const transfers_module_1 = require("./transfers/transfers.module");
const exchange_module_1 = require("./exchange/exchange.module");
const beneficiaries_module_1 = require("./beneficiaries/beneficiaries.module");
const notifications_module_1 = require("./notifications/notifications.module");
const crypto_module_1 = require("./crypto/crypto.module");
const admin_module_1 = require("./admin/admin.module");
const funding_module_1 = require("./funding/funding.module");
const payouts_module_1 = require("./payouts/payouts.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            supabase_module_1.SupabaseModule,
            common_module_1.CommonModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            accounts_module_1.AccountsModule,
            transactions_module_1.TransactionsModule,
            transfers_module_1.TransfersModule,
            exchange_module_1.ExchangeModule,
            beneficiaries_module_1.BeneficiariesModule,
            notifications_module_1.NotificationsModule,
            crypto_module_1.CryptoModule,
            admin_module_1.AdminModule,
            funding_module_1.FundingModule,
            payouts_module_1.PayoutsModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map