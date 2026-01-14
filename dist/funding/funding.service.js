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
exports.FundingService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const accounts_service_1 = require("../accounts/accounts.service");
const transactions_service_1 = require("../transactions/transactions.service");
let FundingService = class FundingService {
    constructor(supabaseService, accountsService, transactionsService) {
        this.supabaseService = supabaseService;
        this.accountsService = accountsService;
        this.transactionsService = transactionsService;
    }
    async initiateWireFunding(userId, accountId, amount, currency) {
        const wireReference = `DOUNI-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
        const account = await this.accountsService.getAccount(userId, accountId);
        const accountDetails = await this.accountsService.getAccountDetails(userId, accountId);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('funding_requests')
            .insert({
            user_id: userId,
            account_id: accountId,
            method: 'wire',
            amount,
            currency,
            wire_reference: wireReference,
            status: 'pending',
            expires_at: expiresAt.toISOString(),
        })
            .select()
            .single();
        if (error)
            throw new common_1.BadRequestException(error.message);
        return {
            fundingId: data.id,
            method: 'wire',
            status: 'pending',
            wireInstructions: {
                reference: wireReference,
                amount,
                currency,
                beneficiaryName: 'DouniPay Ltd',
                beneficiaryIban: accountDetails.iban,
                beneficiaryBic: 'DOUNIXXX',
                bankName: 'DouniPay Bank',
                bankAddress: '123 Finance Street, London, UK',
                importantNotes: [
                    `Include reference "${wireReference}" in payment description`,
                    'Funds typically arrive within 1-3 business days',
                    'Instructions expire in 7 days',
                ],
            },
            expiresAt: expiresAt.toISOString(),
        };
    }
    async initiateCryptoFunding(userId, accountId, symbol, network, expectedAmount) {
        let { data: wallet } = await this.supabaseService
            .getAdminClient()
            .from('crypto_wallets')
            .select('*')
            .eq('user_id', userId)
            .eq('symbol', symbol)
            .eq('network', network)
            .single();
        if (!wallet) {
            const depositAddress = this.generateDepositAddress(symbol, network);
            const { data: newWallet, error: walletError } = await this.supabaseService
                .getAdminClient()
                .from('crypto_wallets')
                .insert({
                user_id: userId,
                symbol,
                network,
                address: depositAddress,
                balance: 0,
            })
                .select()
                .single();
            if (walletError)
                throw new common_1.BadRequestException(walletError.message);
            wallet = newWallet;
        }
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('funding_requests')
            .insert({
            user_id: userId,
            account_id: accountId,
            method: 'crypto',
            amount: expectedAmount || 0,
            currency: symbol,
            crypto_symbol: symbol,
            crypto_network: network,
            crypto_address: wallet.address,
            status: 'pending',
        })
            .select()
            .single();
        if (error)
            throw new common_1.BadRequestException(error.message);
        const confirmations = {
            bitcoin: 3,
            ethereum: 12,
            polygon: 128,
            solana: 32,
        };
        return {
            fundingId: data.id,
            method: 'crypto',
            status: 'pending',
            depositDetails: {
                address: wallet.address,
                symbol,
                network,
                minimumDeposit: this.getMinimumDeposit(symbol),
                confirmationsRequired: confirmations[network] || 12,
                qrCode: `${symbol}:${wallet.address}`,
                warnings: [
                    `Only send ${symbol} on ${network} network to this address`,
                    'Sending other tokens may result in permanent loss',
                ],
            },
        };
    }
    async initiateMobileMoneyFunding(userId, accountId, provider, phone, amount, currency) {
        const { data: providerData } = await this.supabaseService
            .getAdminClient()
            .from('mobile_money_providers')
            .select('*')
            .eq('code', provider)
            .eq('is_active', true)
            .single();
        if (!providerData) {
            throw new common_1.BadRequestException('Mobile money provider not available');
        }
        const fee = 0;
        if (providerData.min_amount && amount < Number(providerData.min_amount)) {
            throw new common_1.BadRequestException(`Minimum amount is ${providerData.min_amount} ${providerData.currency}`);
        }
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('funding_requests')
            .insert({
            user_id: userId,
            account_id: accountId,
            method: 'mobile_money',
            amount,
            currency,
            fee,
            mobile_money_provider: provider,
            mobile_money_phone: phone,
            status: 'pending',
        })
            .select()
            .single();
        if (error)
            throw new common_1.BadRequestException(error.message);
        return {
            fundingId: data.id,
            method: 'mobile_money',
            status: 'pending',
            provider: providerData.name,
            amount,
            currency,
            fee,
            instructions: {
                ussdCode: this.getUssdCode(provider, amount),
                steps: [
                    `Dial ${this.getUssdCode(provider, amount)} on your phone`,
                    'Select "Send Money" or "Pay Merchant"',
                    'Enter the merchant code: DOUNI001',
                    `Enter amount: ${amount} ${currency}`,
                    'Confirm with your PIN',
                ],
                merchantCode: 'DOUNI001',
                reference: data.id,
            },
            estimatedTime: '1-5 minutes',
        };
    }
    async getFundingRequests(userId, status, limit = 20, offset = 0) {
        let query = this.supabaseService
            .getAdminClient()
            .from('funding_requests')
            .select('*', { count: 'exact' })
            .eq('user_id', userId);
        if (status)
            query = query.eq('status', status);
        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        if (error)
            throw new common_1.BadRequestException(error.message);
        return { requests: data, total: count, limit, offset };
    }
    async getFundingRequest(userId, fundingId) {
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('funding_requests')
            .select('*')
            .eq('id', fundingId)
            .eq('user_id', userId)
            .single();
        if (error || !data)
            throw new common_1.NotFoundException('Funding request not found');
        return data;
    }
    async cancelFundingRequest(userId, fundingId) {
        const { error } = await this.supabaseService
            .getAdminClient()
            .from('funding_requests')
            .update({ status: 'cancelled' })
            .eq('id', fundingId)
            .eq('user_id', userId)
            .eq('status', 'pending');
        if (error)
            throw new common_1.BadRequestException(error.message);
        return { message: 'Funding request cancelled' };
    }
    async completeFunding(fundingId, txDetails) {
        const { data: funding } = await this.supabaseService
            .getAdminClient()
            .from('funding_requests')
            .select('*')
            .eq('id', fundingId)
            .single();
        if (!funding)
            throw new common_1.NotFoundException('Funding request not found');
        if (funding.status !== 'pending' && funding.status !== 'processing') {
            throw new common_1.BadRequestException('Funding request cannot be completed');
        }
        await this.accountsService.updateBalance(funding.account_id, funding.amount, 'add');
        await this.supabaseService
            .getAdminClient()
            .from('funding_requests')
            .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            ...(txDetails?.txHash && { crypto_tx_hash: txDetails.txHash }),
            ...(txDetails?.txId && { mobile_money_tx_id: txDetails.txId }),
        })
            .eq('id', fundingId);
        await this.transactionsService.createTransaction({
            user_id: funding.user_id,
            account_id: funding.account_id,
            type: 'deposit',
            amount: funding.amount,
            currency: funding.currency,
            fee: funding.fee || 0,
            description: `${funding.method} deposit`,
            status: 'completed',
            metadata: {
                fundingId,
                method: funding.method,
            },
        });
        return { message: 'Funding completed successfully' };
    }
    generateDepositAddress(symbol, network) {
        const prefix = network === 'bitcoin' ? 'bc1' : '0x';
        const randomPart = Array.from({ length: 40 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
        return `${prefix}${randomPart}`;
    }
    getMinimumDeposit(symbol) {
        const minimums = {
            BTC: 0.0001,
            ETH: 0.01,
            USDT: 10,
            USDC: 10,
            SOL: 0.1,
        };
        return minimums[symbol] || 0.01;
    }
    getUssdCode(provider, amount) {
        const ussdCodes = {
            mtn_ci: '*133#',
            orange_ci: '*144#',
            mtn_gh: '*170#',
            mpesa_ke: '*334#',
            wave_sn: '*222#',
            orange_sn: '#144#',
            inwi_ma: '*140#',
        };
        return ussdCodes[provider] || '*100#';
    }
};
exports.FundingService = FundingService;
exports.FundingService = FundingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        accounts_service_1.AccountsService,
        transactions_service_1.TransactionsService])
], FundingService);
//# sourceMappingURL=funding.service.js.map