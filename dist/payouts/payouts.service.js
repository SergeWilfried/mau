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
exports.PayoutsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const accounts_service_1 = require("../accounts/accounts.service");
const transactions_service_1 = require("../transactions/transactions.service");
let PayoutsService = class PayoutsService {
    constructor(supabaseService, accountsService, transactionsService) {
        this.supabaseService = supabaseService;
        this.accountsService = accountsService;
        this.transactionsService = transactionsService;
    }
    async initiateBankPayout(userId, fromAccountId, details) {
        let bankDetails = {
            bankName: details.bankName,
            accountName: details.accountName,
            accountNumber: details.accountNumber,
            iban: details.iban,
            bic: details.bic,
            routingNumber: details.routingNumber,
            country: details.country,
        };
        if (details.beneficiaryId) {
            const { data: beneficiary } = await this.supabaseService
                .getAdminClient()
                .from('beneficiaries')
                .select('*')
                .eq('id', details.beneficiaryId)
                .eq('user_id', userId)
                .single();
            if (!beneficiary)
                throw new common_1.NotFoundException('Beneficiary not found');
            bankDetails = {
                bankName: beneficiary.bank_name,
                accountName: beneficiary.name,
                accountNumber: beneficiary.bank_account_number,
                iban: beneficiary.iban,
                bic: beneficiary.bic,
                routingNumber: beneficiary.routing_number,
                country: beneficiary.bank_country || details.country,
            };
        }
        const fee = this.calculateBankPayoutFee(details.country, details.amount, details.currency);
        const totalAmount = details.amount + fee;
        await this.accountsService.updateBalance(fromAccountId, totalAmount, 'subtract');
        const estimatedArrival = this.calculateEstimatedArrival(details.country);
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('payout_requests')
            .insert({
            user_id: userId,
            account_id: fromAccountId,
            method: 'bank_account',
            amount: details.amount,
            currency: details.currency,
            fee,
            bank_name: bankDetails.bankName,
            bank_account_name: bankDetails.accountName,
            bank_account_number: bankDetails.accountNumber,
            bank_iban: bankDetails.iban,
            bank_bic: bankDetails.bic,
            bank_routing_number: bankDetails.routingNumber,
            bank_country: bankDetails.country,
            reference: details.reference,
            status: 'pending',
            estimated_arrival: estimatedArrival.toISOString(),
        })
            .select()
            .single();
        if (error)
            throw new common_1.BadRequestException(error.message);
        await this.transactionsService.createTransaction({
            user_id: userId,
            account_id: fromAccountId,
            type: 'withdrawal',
            amount: -totalAmount,
            currency: details.currency,
            fee,
            description: `Bank payout to ${bankDetails.accountName}`,
            status: 'pending',
            metadata: {
                payoutId: data.id,
                method: 'bank_account',
                destination: bankDetails.country,
            },
        });
        return {
            payoutId: data.id,
            method: 'bank_account',
            status: 'pending',
            amount: details.amount,
            fee,
            totalDeducted: totalAmount,
            currency: details.currency,
            estimatedArrival: estimatedArrival.toISOString().split('T')[0],
            recipient: {
                name: bankDetails.accountName,
                bank: bankDetails.bankName,
                country: bankDetails.country,
            },
        };
    }
    async initiateMobileMoneyPayout(userId, fromAccountId, details) {
        if (details.beneficiaryId) {
            const { data: beneficiary } = await this.supabaseService
                .getAdminClient()
                .from('beneficiaries')
                .select('*')
                .eq('id', details.beneficiaryId)
                .eq('user_id', userId)
                .single();
            if (beneficiary) {
                details.provider = beneficiary.mobile_money_provider || details.provider;
                details.phone = beneficiary.mobile_money_phone || details.phone;
                details.recipientName = beneficiary.name || details.recipientName;
            }
        }
        const { data: provider } = await this.supabaseService
            .getAdminClient()
            .from('mobile_money_providers')
            .select('*')
            .eq('code', details.provider)
            .eq('is_active', true)
            .single();
        if (!provider) {
            throw new common_1.BadRequestException('Mobile money provider not available');
        }
        const fee = details.amount * Number(provider.fee_percentage) + Number(provider.fee_fixed || 0);
        const totalAmount = details.amount + fee;
        if (provider.min_amount && details.amount < Number(provider.min_amount)) {
            throw new common_1.BadRequestException(`Minimum payout is ${provider.min_amount} ${provider.currency}`);
        }
        if (provider.max_amount && details.amount > Number(provider.max_amount)) {
            throw new common_1.BadRequestException(`Maximum payout is ${provider.max_amount} ${provider.currency}`);
        }
        await this.accountsService.updateBalance(fromAccountId, totalAmount, 'subtract');
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('payout_requests')
            .insert({
            user_id: userId,
            account_id: fromAccountId,
            method: 'mobile_money',
            amount: details.amount,
            currency: details.currency,
            fee,
            mobile_money_provider: details.provider,
            mobile_money_phone: details.phone,
            mobile_money_recipient_name: details.recipientName,
            note: details.note,
            status: 'processing',
        })
            .select()
            .single();
        if (error)
            throw new common_1.BadRequestException(error.message);
        await this.transactionsService.createTransaction({
            user_id: userId,
            account_id: fromAccountId,
            type: 'withdrawal',
            amount: -totalAmount,
            currency: details.currency,
            fee,
            description: `Mobile money payout to ${details.phone}`,
            status: 'processing',
            metadata: {
                payoutId: data.id,
                method: 'mobile_money',
                provider: details.provider,
                phone: details.phone,
                recipientName: details.recipientName,
            },
        });
        return {
            payoutId: data.id,
            method: 'mobile_money',
            status: 'processing',
            amount: details.amount,
            fee,
            totalDeducted: totalAmount,
            currency: details.currency,
            estimatedTime: '1-5 minutes',
            recipient: {
                name: details.recipientName,
                phone: details.phone,
                provider: provider.name,
            },
        };
    }
    async getPayouts(userId, status, method, limit = 20, offset = 0) {
        let query = this.supabaseService
            .getAdminClient()
            .from('payout_requests')
            .select('*', { count: 'exact' })
            .eq('user_id', userId);
        if (status)
            query = query.eq('status', status);
        if (method)
            query = query.eq('method', method);
        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        if (error)
            throw new common_1.BadRequestException(error.message);
        return { payouts: data, total: count, limit, offset };
    }
    async getPayout(userId, payoutId) {
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('payout_requests')
            .select('*')
            .eq('id', payoutId)
            .eq('user_id', userId)
            .single();
        if (error || !data)
            throw new common_1.NotFoundException('Payout not found');
        return data;
    }
    async cancelPayout(userId, payoutId) {
        const payout = await this.getPayout(userId, payoutId);
        if (payout.status !== 'pending') {
            throw new common_1.BadRequestException('Only pending payouts can be cancelled');
        }
        const refundAmount = Number(payout.amount) + Number(payout.fee || 0);
        await this.accountsService.updateBalance(payout.account_id, refundAmount, 'add');
        await this.supabaseService
            .getAdminClient()
            .from('payout_requests')
            .update({ status: 'cancelled' })
            .eq('id', payoutId);
        return { message: 'Payout cancelled and refunded' };
    }
    async getPayoutQuote(method, details) {
        let fee = 0;
        let estimatedTime = '';
        if (method === 'bank_account') {
            fee = this.calculateBankPayoutFee(details.country || 'EU', details.amount, details.currency);
            const arrival = this.calculateEstimatedArrival(details.country || 'EU');
            estimatedTime = `${Math.ceil((arrival.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} business days`;
        }
        else if (method === 'mobile_money' && details.provider) {
            const { data: provider } = await this.supabaseService
                .getAdminClient()
                .from('mobile_money_providers')
                .select('*')
                .eq('code', details.provider)
                .single();
            if (provider) {
                fee = details.amount * Number(provider.fee_percentage) + Number(provider.fee_fixed || 0);
            }
            estimatedTime = '1-5 minutes';
        }
        return {
            method,
            amount: details.amount,
            fee,
            totalAmount: details.amount + fee,
            currency: details.currency,
            estimatedTime,
            exchangeRate: null,
        };
    }
    async getPayoutMethods(country) {
        const methods = [
            {
                id: 'bank_account',
                name: 'Bank Account',
                description: 'Direct bank transfer',
                supportedCountries: 'all',
                minAmount: 10,
                maxAmount: 100000,
                estimatedTime: '1-5 business days',
                requiredFields: ['accountName', 'iban', 'bic'],
            },
            {
                id: 'mobile_money',
                name: 'Mobile Money',
                description: 'Instant mobile money transfer',
                supportedCountries: ['CI', 'SN', 'GH', 'KE', 'UG', 'MA', 'CM', 'TZ'],
                minAmount: 1,
                maxAmount: 5000,
                estimatedTime: '1-5 minutes',
                requiredFields: ['provider', 'phone', 'recipientName'],
            },
        ];
        if (country) {
            return {
                methods: methods.filter((m) => m.supportedCountries === 'all' || m.supportedCountries.includes(country)),
            };
        }
        return { methods };
    }
    calculateBankPayoutFee(country, amount, currency) {
        const sepaCountries = ['DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'PT', 'IE', 'FI', 'GR', 'LU'];
        if (sepaCountries.includes(country) && currency === 'EUR') {
            return Math.max(1, amount * 0.001);
        }
        if (country === 'GB') {
            return Math.max(2, amount * 0.002);
        }
        if (country === 'US') {
            return Math.max(5, amount * 0.003);
        }
        const africanCountries = ['MA', 'SN', 'CI', 'GH', 'KE', 'NG', 'ZA', 'EG'];
        if (africanCountries.includes(country)) {
            return Math.max(3, amount * 0.01);
        }
        return Math.max(10, amount * 0.005);
    }
    calculateEstimatedArrival(country) {
        const arrival = new Date();
        const sepaCountries = ['DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'PT', 'IE', 'FI', 'GR', 'LU'];
        if (sepaCountries.includes(country)) {
            arrival.setDate(arrival.getDate() + 1);
            return arrival;
        }
        if (country === 'GB') {
            arrival.setDate(arrival.getDate() + 2);
            return arrival;
        }
        if (country === 'US') {
            arrival.setDate(arrival.getDate() + 3);
            return arrival;
        }
        const africanCountries = ['MA', 'SN', 'CI', 'GH', 'KE', 'NG', 'ZA', 'EG'];
        if (africanCountries.includes(country)) {
            arrival.setDate(arrival.getDate() + 4);
            return arrival;
        }
        arrival.setDate(arrival.getDate() + 5);
        return arrival;
    }
};
exports.PayoutsService = PayoutsService;
exports.PayoutsService = PayoutsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        accounts_service_1.AccountsService,
        transactions_service_1.TransactionsService])
], PayoutsService);
//# sourceMappingURL=payouts.service.js.map