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
exports.AccountsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let AccountsService = class AccountsService {
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async getAccounts(userId) {
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('accounts')
            .select('*')
            .eq('user_id', userId)
            .order('is_main', { ascending: false });
        if (error)
            throw new common_1.BadRequestException(error.message);
        return { accounts: data };
    }
    async createAccount(userId, currency) {
        const { data: existing } = await this.supabaseService
            .getAdminClient()
            .from('accounts')
            .select('id')
            .eq('user_id', userId)
            .eq('currency', currency)
            .single();
        if (existing) {
            throw new common_1.BadRequestException(`Account with currency ${currency} already exists`);
        }
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('accounts')
            .insert({
            user_id: userId,
            currency,
            balance: 0,
            is_main: false,
        })
            .select()
            .single();
        if (error)
            throw new common_1.BadRequestException(error.message);
        return data;
    }
    async getAccount(userId, accountId) {
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('accounts')
            .select('*')
            .eq('id', accountId)
            .eq('user_id', userId)
            .single();
        if (error || !data)
            throw new common_1.NotFoundException('Account not found');
        return data;
    }
    async getAccountDetails(userId, accountId) {
        const account = await this.getAccount(userId, accountId);
        return {
            iban: account.iban || this.generateIBAN(),
            bic: 'DOUNIXXX',
            accountHolder: 'Account Holder',
            bankName: 'DouniPay',
            bankAddress: '123 Finance Street',
            currency: account.currency,
        };
    }
    async setMainAccount(userId, accountId) {
        await this.supabaseService
            .getAdminClient()
            .from('accounts')
            .update({ is_main: false })
            .eq('user_id', userId);
        const { error } = await this.supabaseService
            .getAdminClient()
            .from('accounts')
            .update({ is_main: true })
            .eq('id', accountId)
            .eq('user_id', userId);
        if (error)
            throw new common_1.BadRequestException(error.message);
        return { message: 'Main account updated successfully' };
    }
    async getTotalBalance(userId, targetCurrency = 'EUR') {
        const { data: accounts } = await this.supabaseService
            .getAdminClient()
            .from('accounts')
            .select('currency, balance')
            .eq('user_id', userId);
        const totalBalance = accounts?.reduce((sum, acc) => sum + Number(acc.balance), 0) || 0;
        return { totalBalance, currency: targetCurrency };
    }
    async getStatements(userId, accountId, from, to) {
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('transactions')
            .select('*')
            .eq('account_id', accountId)
            .eq('user_id', userId)
            .gte('created_at', from)
            .lte('created_at', to)
            .order('created_at', { ascending: false });
        if (error)
            throw new common_1.BadRequestException(error.message);
        return { statements: data, accountId, from, to };
    }
    async updateBalance(accountId, amount, operation) {
        const { data: account } = await this.supabaseService
            .getAdminClient()
            .from('accounts')
            .select('balance')
            .eq('id', accountId)
            .single();
        const currentBalance = Number(account?.balance || 0);
        const newBalance = operation === 'add'
            ? currentBalance + amount
            : currentBalance - amount;
        if (newBalance < 0) {
            throw new common_1.BadRequestException('Insufficient funds');
        }
        const { error } = await this.supabaseService
            .getAdminClient()
            .from('accounts')
            .update({ balance: newBalance })
            .eq('id', accountId);
        if (error)
            throw new common_1.BadRequestException(error.message);
        return newBalance;
    }
    generateIBAN() {
        const countryCode = 'GB';
        const checkDigits = '00';
        const bankCode = 'DOUN';
        const accountNumber = Math.random().toString().slice(2, 16).padEnd(14, '0');
        return `${countryCode}${checkDigits}${bankCode}${accountNumber}`;
    }
};
exports.AccountsService = AccountsService;
exports.AccountsService = AccountsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], AccountsService);
//# sourceMappingURL=accounts.service.js.map