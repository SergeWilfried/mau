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
exports.TransfersService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const accounts_service_1 = require("../accounts/accounts.service");
const transactions_service_1 = require("../transactions/transactions.service");
let TransfersService = class TransfersService {
    constructor(supabaseService, accountsService, transactionsService) {
        this.supabaseService = supabaseService;
        this.accountsService = accountsService;
        this.transactionsService = transactionsService;
    }
    async internalTransfer(userId, fromAccountId, toAccountId, amount) {
        const fromAccount = await this.accountsService.getAccount(userId, fromAccountId);
        const toAccount = await this.accountsService.getAccount(userId, toAccountId);
        await this.accountsService.updateBalance(fromAccountId, amount, 'subtract');
        await this.accountsService.updateBalance(toAccountId, amount, 'add');
        const { data: transfer, error } = await this.supabaseService
            .getAdminClient()
            .from('transfers')
            .insert({
            sender_id: userId,
            sender_account_id: fromAccountId,
            recipient_id: userId,
            recipient_account_id: toAccountId,
            type: 'internal',
            amount,
            currency: fromAccount.currency,
            status: 'completed',
            executed_at: new Date().toISOString(),
        })
            .select()
            .single();
        if (error)
            throw new common_1.BadRequestException(error.message);
        await this.transactionsService.createTransaction({
            user_id: userId,
            account_id: fromAccountId,
            type: 'transfer_out',
            amount: -amount,
            currency: fromAccount.currency,
            description: `Transfer to ${toAccount.currency} account`,
            status: 'completed',
        });
        await this.transactionsService.createTransaction({
            user_id: userId,
            account_id: toAccountId,
            type: 'transfer_in',
            amount: amount,
            currency: toAccount.currency,
            description: `Transfer from ${fromAccount.currency} account`,
            status: 'completed',
        });
        return {
            transactionId: transfer.id,
            status: 'completed',
            message: 'Transfer completed successfully',
        };
    }
    async p2pTransfer(userId, fromAccountId, recipient, recipientType, amount, currency, note) {
        let recipientUser = null;
        if (recipientType === 'phone') {
            const { data } = await this.supabaseService
                .getAdminClient()
                .from('profiles')
                .select('id')
                .eq('phone', recipient)
                .single();
            recipientUser = data;
        }
        else if (recipientType === 'email') {
            const { data } = await this.supabaseService
                .getAdminClient()
                .from('profiles')
                .select('id')
                .eq('email', recipient)
                .single();
            recipientUser = data;
        }
        if (!recipientUser) {
            throw new common_1.NotFoundException('Recipient not found');
        }
        const { data: recipientAccount } = await this.supabaseService
            .getAdminClient()
            .from('accounts')
            .select('id')
            .eq('user_id', recipientUser.id)
            .eq('currency', currency)
            .single();
        await this.accountsService.updateBalance(fromAccountId, amount, 'subtract');
        if (recipientAccount) {
            await this.accountsService.updateBalance(recipientAccount.id, amount, 'add');
        }
        const { data: transfer, error } = await this.supabaseService
            .getAdminClient()
            .from('transfers')
            .insert({
            sender_id: userId,
            sender_account_id: fromAccountId,
            recipient_id: recipientUser.id,
            recipient_account_id: recipientAccount?.id,
            type: 'p2p',
            amount,
            currency,
            note,
            status: 'completed',
            executed_at: new Date().toISOString(),
        })
            .select()
            .single();
        if (error)
            throw new common_1.BadRequestException(error.message);
        return {
            transactionId: transfer.id,
            status: 'completed',
            message: 'Money sent successfully',
        };
    }
    async bankTransfer(userId, fromAccountId, transferDetails) {
        const fee = transferDetails.transferType === 'swift' ? 5.0 : 0;
        const totalAmount = transferDetails.amount + fee;
        await this.accountsService.updateBalance(fromAccountId, totalAmount, 'subtract');
        const { data: transfer, error } = await this.supabaseService
            .getAdminClient()
            .from('transfers')
            .insert({
            sender_id: userId,
            sender_account_id: fromAccountId,
            type: `bank_${transferDetails.transferType}`,
            amount: transferDetails.amount,
            currency: transferDetails.currency,
            fee,
            recipient_iban: transferDetails.iban,
            recipient_bic: transferDetails.bic,
            recipient_name: transferDetails.recipientName,
            reference: transferDetails.reference,
            status: 'pending',
        })
            .select()
            .single();
        if (error)
            throw new common_1.BadRequestException(error.message);
        const estimatedArrival = new Date();
        estimatedArrival.setDate(estimatedArrival.getDate() + (transferDetails.transferType === 'swift' ? 3 : 1));
        return {
            transactionId: transfer.id,
            status: 'pending',
            estimatedArrival: estimatedArrival.toISOString().split('T')[0],
            fee,
        };
    }
    async requestMoney(userId, recipient, recipientType, amount, currency, note) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('payment_requests')
            .insert({
            requester_id: userId,
            payer_identifier: recipient,
            payer_type: recipientType,
            amount,
            currency,
            note,
            expires_at: expiresAt.toISOString(),
        })
            .select()
            .single();
        if (error)
            throw new common_1.BadRequestException(error.message);
        return {
            requestId: data.id,
            status: 'pending',
            message: 'Payment request sent',
        };
    }
    async getPaymentRequests(userId) {
        const { data: incoming } = await this.supabaseService
            .getAdminClient()
            .from('payment_requests')
            .select('*')
            .eq('payer_id', userId)
            .eq('status', 'pending');
        const { data: outgoing } = await this.supabaseService
            .getAdminClient()
            .from('payment_requests')
            .select('*')
            .eq('requester_id', userId);
        return { incoming: incoming || [], outgoing: outgoing || [] };
    }
    async acceptPaymentRequest(userId, requestId, fromAccountId) {
        const { data: request } = await this.supabaseService
            .getAdminClient()
            .from('payment_requests')
            .select('*')
            .eq('id', requestId)
            .single();
        if (!request)
            throw new common_1.NotFoundException('Payment request not found');
        await this.accountsService.updateBalance(fromAccountId, request.amount, 'subtract');
        await this.supabaseService
            .getAdminClient()
            .from('payment_requests')
            .update({ status: 'accepted', payer_id: userId })
            .eq('id', requestId);
        return {
            transactionId: requestId,
            status: 'completed',
            message: 'Payment completed',
        };
    }
    async declinePaymentRequest(userId, requestId) {
        await this.supabaseService
            .getAdminClient()
            .from('payment_requests')
            .update({ status: 'declined' })
            .eq('id', requestId);
        return { message: 'Request declined' };
    }
    async scheduleTransfer(userId, details) {
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('scheduled_transfers')
            .insert({
            user_id: userId,
            transfer_details: details.transferDetails,
            frequency: details.recurring?.frequency || 'once',
            next_execution_at: details.scheduledDate,
            end_date: details.recurring?.endDate,
        })
            .select()
            .single();
        if (error)
            throw new common_1.BadRequestException(error.message);
        return {
            scheduledTransferId: data.id,
            status: 'scheduled',
            nextExecutionDate: details.scheduledDate,
        };
    }
    async getScheduledTransfers(userId) {
        const { data } = await this.supabaseService
            .getAdminClient()
            .from('scheduled_transfers')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'active');
        return { scheduledTransfers: data || [] };
    }
    async cancelScheduledTransfer(userId, scheduledId) {
        await this.supabaseService
            .getAdminClient()
            .from('scheduled_transfers')
            .update({ status: 'cancelled' })
            .eq('id', scheduledId)
            .eq('user_id', userId);
        return { message: 'Scheduled transfer cancelled' };
    }
    async cryptoTransfer(userId, details) {
        const { data: wallet } = await this.supabaseService
            .getAdminClient()
            .from('crypto_wallets')
            .select('*')
            .eq('id', details.fromWalletId)
            .eq('user_id', userId)
            .single();
        if (!wallet) {
            throw new common_1.NotFoundException('Wallet not found');
        }
        if (Number(wallet.balance) < details.amount) {
            throw new common_1.BadRequestException('Insufficient crypto balance');
        }
        const networkFees = {
            bitcoin: 0.0001,
            ethereum: 0.002,
            polygon: 0.001,
            solana: 0.00001,
        };
        const fee = networkFees[details.network] || 0.001;
        await this.supabaseService
            .getAdminClient()
            .from('crypto_wallets')
            .update({ balance: Number(wallet.balance) - details.amount - fee })
            .eq('id', details.fromWalletId);
        const { data: transfer, error } = await this.supabaseService
            .getAdminClient()
            .from('transfers')
            .insert({
            sender_id: userId,
            type: 'crypto',
            amount: details.amount,
            currency: details.symbol,
            fee,
            crypto_symbol: details.symbol,
            crypto_network: details.network,
            crypto_address: details.toAddress,
            note: details.note,
            status: 'processing',
        })
            .select()
            .single();
        if (error)
            throw new common_1.BadRequestException(error.message);
        await this.supabaseService
            .getAdminClient()
            .from('crypto_transactions')
            .insert({
            user_id: userId,
            wallet_id: details.fromWalletId,
            type: 'withdrawal',
            symbol: details.symbol,
            amount: details.amount,
            fee,
            fee_currency: details.symbol,
            external_address: details.toAddress,
            network: details.network,
            status: 'processing',
        });
        return {
            transferId: transfer.id,
            status: 'processing',
            fee,
            feeCurrency: details.symbol,
            estimatedTime: '10-60 minutes',
            message: 'Crypto transfer initiated',
        };
    }
    async mobileMoneyTransfer(userId, fromAccountId, details) {
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
            throw new common_1.BadRequestException(`Minimum amount is ${provider.min_amount} ${provider.currency}`);
        }
        if (provider.max_amount && details.amount > Number(provider.max_amount)) {
            throw new common_1.BadRequestException(`Maximum amount is ${provider.max_amount} ${provider.currency}`);
        }
        await this.accountsService.updateBalance(fromAccountId, totalAmount, 'subtract');
        const { data: transfer, error } = await this.supabaseService
            .getAdminClient()
            .from('transfers')
            .insert({
            sender_id: userId,
            sender_account_id: fromAccountId,
            type: 'mobile_money',
            amount: details.amount,
            currency: details.currency,
            fee,
            recipient_name: details.recipientName,
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
            type: 'transfer_out',
            amount: -totalAmount,
            currency: details.currency,
            fee,
            description: `Mobile money to ${details.phone}`,
            status: 'processing',
            metadata: {
                provider: details.provider,
                phone: details.phone,
                recipientName: details.recipientName,
            },
        });
        return {
            transferId: transfer.id,
            status: 'processing',
            fee,
            totalAmount,
            estimatedTime: '1-5 minutes',
            message: 'Mobile money transfer initiated',
        };
    }
    async getMobileMoneyProviders(country) {
        let query = this.supabaseService
            .getAdminClient()
            .from('mobile_money_providers')
            .select('*')
            .eq('is_active', true);
        if (country) {
            query = query.eq('country', country);
        }
        const { data } = await query.order('name');
        return { providers: data || [] };
    }
};
exports.TransfersService = TransfersService;
exports.TransfersService = TransfersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        accounts_service_1.AccountsService,
        transactions_service_1.TransactionsService])
], TransfersService);
//# sourceMappingURL=transfers.service.js.map