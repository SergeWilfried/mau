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
exports.ExchangeService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const accounts_service_1 = require("../accounts/accounts.service");
const transactions_service_1 = require("../transactions/transactions.service");
let ExchangeService = class ExchangeService {
    constructor(supabaseService, accountsService, transactionsService) {
        this.supabaseService = supabaseService;
        this.accountsService = accountsService;
        this.transactionsService = transactionsService;
        this.mockRates = {
            EUR: { USD: 1.08, GBP: 0.86, MAD: 10.85, CHF: 0.94, JPY: 162.5, CAD: 1.47 },
            USD: { EUR: 0.93, GBP: 0.80, MAD: 10.05, CHF: 0.87, JPY: 150.5, CAD: 1.36 },
            GBP: { EUR: 1.16, USD: 1.25, MAD: 12.60, CHF: 1.09, JPY: 188.7, CAD: 1.70 },
        };
    }
    async getRates(base = 'EUR') {
        const { data: cachedRates } = await this.supabaseService
            .getAdminClient()
            .from('exchange_rates')
            .select('target_currency, rate')
            .eq('base_currency', base);
        let rates = {};
        if (cachedRates && cachedRates.length > 0) {
            cachedRates.forEach((r) => {
                rates[r.target_currency] = r.rate;
            });
        }
        else {
            rates = this.mockRates[base] || {};
        }
        return {
            base,
            timestamp: new Date().toISOString(),
            rates,
        };
    }
    async getRate(from, to, amount = 1) {
        const rates = await this.getRates(from);
        const rate = rates.rates[to] || 1;
        return {
            from,
            to,
            rate,
            amount,
            convertedAmount: amount * rate,
            fee: 0,
            timestamp: new Date().toISOString(),
        };
    }
    async getQuote(body) {
        const rate = (await this.getRate(body.fromCurrency, body.toCurrency)).rate;
        let fromAmount;
        let toAmount;
        if (body.fromAmount) {
            fromAmount = body.fromAmount;
            toAmount = fromAmount * rate;
        }
        else if (body.toAmount) {
            toAmount = body.toAmount;
            fromAmount = toAmount / rate;
        }
        else {
            fromAmount = 100;
            toAmount = fromAmount * rate;
        }
        const fee = fromAmount * 0.005;
        const quoteId = `quote_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        return {
            fromCurrency: body.fromCurrency,
            toCurrency: body.toCurrency,
            fromAmount,
            toAmount,
            rate,
            fee,
            expiresAt: new Date(Date.now() + 30000).toISOString(),
            quoteId,
        };
    }
    async convert(userId, fromAccountId, toAccountId, fromAmount, toAmount) {
        const fromAccount = await this.accountsService.getAccount(userId, fromAccountId);
        const toAccount = await this.accountsService.getAccount(userId, toAccountId);
        const rateInfo = await this.getRate(fromAccount.currency, toAccount.currency, fromAmount || 100);
        const actualFromAmount = fromAmount || (toAmount ? toAmount / rateInfo.rate : 100);
        const actualToAmount = toAmount || actualFromAmount * rateInfo.rate;
        const fee = actualFromAmount * 0.005;
        await this.accountsService.updateBalance(fromAccountId, actualFromAmount + fee, 'subtract');
        await this.accountsService.updateBalance(toAccountId, actualToAmount, 'add');
        const txOut = await this.transactionsService.createTransaction({
            user_id: userId,
            account_id: fromAccountId,
            type: 'exchange_out',
            amount: -(actualFromAmount + fee),
            currency: fromAccount.currency,
            fee,
            description: `Exchange to ${toAccount.currency}`,
            status: 'completed',
            metadata: { rate: rateInfo.rate, toCurrency: toAccount.currency },
        });
        await this.transactionsService.createTransaction({
            user_id: userId,
            account_id: toAccountId,
            type: 'exchange_in',
            amount: actualToAmount,
            currency: toAccount.currency,
            description: `Exchange from ${fromAccount.currency}`,
            status: 'completed',
            related_transaction_id: txOut.id,
            metadata: { rate: rateInfo.rate, fromCurrency: fromAccount.currency },
        });
        return {
            transactionId: txOut.id,
            fromAmount: actualFromAmount,
            fromCurrency: fromAccount.currency,
            toAmount: actualToAmount,
            toCurrency: toAccount.currency,
            rate: rateInfo.rate,
            fee,
            status: 'completed',
        };
    }
    async getSupportedCurrencies() {
        return {
            currencies: [
                { code: 'EUR', name: 'Euro', symbol: '€' },
                { code: 'USD', name: 'US Dollar', symbol: '$' },
                { code: 'GBP', name: 'British Pound', symbol: '£' },
                { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.' },
                { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
                { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
                { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
                { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
                { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
                { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
            ],
        };
    }
    async getExchangeHistory(userId, limit = 20, offset = 0) {
        const { data, error, count } = await this.supabaseService
            .getAdminClient()
            .from('transactions')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .in('type', ['exchange_in', 'exchange_out'])
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        if (error)
            throw new common_1.BadRequestException(error.message);
        return { exchanges: data, total: count, limit, offset };
    }
};
exports.ExchangeService = ExchangeService;
exports.ExchangeService = ExchangeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        accounts_service_1.AccountsService,
        transactions_service_1.TransactionsService])
], ExchangeService);
//# sourceMappingURL=exchange.service.js.map