import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AccountsService {
    private readonly logger = new Logger(AccountsService.name);

    constructor(private supabaseService: SupabaseService) {}

    async getAccounts(userId: string) {
        this.logger.log(`Fetching accounts for user ${userId}`);
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('accounts')
            .select('*')
            .eq('user_id', userId)
            .order('is_main', { ascending: false });

        if (error) {
            this.logger.error(`Failed to fetch accounts for user ${userId}: ${error.message}`);
            throw new BadRequestException(error.message);
        }
        this.logger.log(`Found ${data?.length || 0} accounts for user ${userId}`);
        return { accounts: data };
    }

    async createAccount(userId: string, currency: string) {
        this.logger.log(`Creating ${currency} account for user ${userId}`);
        // Check if account with this currency already exists
        const { data: existing } = await this.supabaseService
            .getAdminClient()
            .from('accounts')
            .select('id')
            .eq('user_id', userId)
            .eq('currency', currency)
            .single();

        if (existing) {
            this.logger.warn(`Account with currency ${currency} already exists for user ${userId}`);
            throw new BadRequestException(`Account with currency ${currency} already exists`);
        }

        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('accounts')
            .insert({
                user_id: userId,
                currency,
                balance: 0,
                is_main: false
            })
            .select()
            .single();

        if (error) {
            this.logger.error(`Failed to create ${currency} account for user ${userId}: ${error.message}`);
            throw new BadRequestException(error.message);
        }
        this.logger.log(`Created ${currency} account ${data.id} for user ${userId}`);
        return data;
    }

    async getAccount(userId: string, accountId: string) {
        this.logger.log(`Fetching account ${accountId} for user ${userId}`);
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('accounts')
            .select('*')
            .eq('id', accountId)
            .eq('user_id', userId)
            .single();

        if (error || !data) {
            this.logger.warn(`Account ${accountId} not found for user ${userId}`);
            throw new NotFoundException('Account not found');
        }
        return data;
    }

    async getAccountDetails(userId: string, accountId: string) {
        this.logger.log(`Fetching account details for account ${accountId}`);
        const account = await this.getAccount(userId, accountId);

        return {
            iban: account.iban || this.generateIBAN(),
            bic: 'DOUNIXXX',
            accountHolder: 'Account Holder', // Would come from profile
            bankName: 'DouniPay',
            bankAddress: '123 Finance Street',
            currency: account.currency
        };
    }

    async setMainAccount(userId: string, accountId: string) {
        this.logger.log(`Setting account ${accountId} as main for user ${userId}`);
        // First, unset all main accounts
        await this.supabaseService.getAdminClient().from('accounts').update({ is_main: false }).eq('user_id', userId);

        // Set the new main account
        const { error } = await this.supabaseService
            .getAdminClient()
            .from('accounts')
            .update({ is_main: true })
            .eq('id', accountId)
            .eq('user_id', userId);

        if (error) {
            this.logger.error(`Failed to set main account ${accountId} for user ${userId}: ${error.message}`);
            throw new BadRequestException(error.message);
        }
        this.logger.log(`Account ${accountId} set as main for user ${userId}`);
        return { message: 'Main account updated successfully' };
    }

    async getTotalBalance(userId: string, targetCurrency: string = 'EUR') {
        this.logger.log(`Calculating total balance for user ${userId} in ${targetCurrency}`);
        const { data: accounts } = await this.supabaseService
            .getAdminClient()
            .from('accounts')
            .select('currency, balance')
            .eq('user_id', userId);

        // In production, would convert all balances to target currency
        const totalBalance = accounts?.reduce((sum, acc) => sum + Number(acc.balance), 0) || 0;
        this.logger.log(`Total balance for user ${userId}: ${totalBalance} ${targetCurrency}`);

        return { totalBalance, currency: targetCurrency };
    }

    async getStatements(userId: string, accountId: string, from: string, to: string) {
        this.logger.log(`Fetching statements for account ${accountId} from ${from} to ${to}`);
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('transactions')
            .select('*')
            .eq('account_id', accountId)
            .eq('user_id', userId)
            .gte('created_at', from)
            .lte('created_at', to)
            .order('created_at', { ascending: false });

        if (error) {
            this.logger.error(`Failed to fetch statements for account ${accountId}: ${error.message}`);
            throw new BadRequestException(error.message);
        }
        this.logger.log(`Found ${data?.length || 0} statements for account ${accountId}`);
        return { statements: data, accountId, from, to };
    }

    async updateBalance(accountId: string, amount: number, operation: 'add' | 'subtract') {
        this.logger.log(`Updating balance for account ${accountId}: ${operation} ${amount}`);
        const { data: account, error: fetchError } = await this.supabaseService
            .getAdminClient()
            .from('accounts')
            .select('id, balance')
            .eq('id', accountId)
            .single();

        if (fetchError || !account) {
            this.logger.error(`Account ${accountId} not found: ${fetchError?.message || 'No data returned'}`);
            throw new NotFoundException(`Account not found: ${accountId}`);
        }

        const currentBalance = Number(account.balance);
        const newBalance = operation === 'add' ? currentBalance + amount : currentBalance - amount;

        if (newBalance < 0) {
            this.logger.warn(
                `Insufficient funds for account ${accountId}: current=${currentBalance}, requested=${amount}`
            );
            throw new BadRequestException('Insufficient funds');
        }

        const { error } = await this.supabaseService
            .getAdminClient()
            .from('accounts')
            .update({ balance: newBalance })
            .eq('id', accountId);

        if (error) {
            this.logger.error(`Failed to update balance for account ${accountId}: ${error.message}`);
            throw new BadRequestException(error.message);
        }
        this.logger.log(`Balance updated for account ${accountId}: ${currentBalance} -> ${newBalance}`);
        return newBalance;
    }

    async getAllActivity(
        userId: string,
        filters: {
            type?: 'fiat' | 'crypto' | 'all';
            accountId?: string;
            walletId?: string;
            from?: string;
            to?: string;
            limit?: number;
            offset?: number;
        } = {}
    ) {
        const { type = 'all', accountId, walletId, from, to, limit = 20, offset = 0 } = filters;
        this.logger.log(`Fetching all activity for user ${userId} with filters: ${JSON.stringify(filters)}`);

        const fetchFiat = type === 'all' || type === 'fiat';
        const fetchCrypto = type === 'all' || type === 'crypto';

        // Fetch both transaction types in parallel
        const [fiatResult, cryptoResult] = await Promise.all([
            fetchFiat ? this.getFiatTransactions(userId, { accountId, from, to }) : Promise.resolve([]),
            fetchCrypto ? this.getCryptoTransactions(userId, { walletId, from, to }) : Promise.resolve([])
        ]);

        // Normalize and merge transactions
        const normalizedFiat = fiatResult.map((tx) => this.normalizeFiatTransaction(tx));
        const normalizedCrypto = cryptoResult.map((tx) => this.normalizeCryptoTransaction(tx));

        // Combine and sort by date descending
        const allActivity = [...normalizedFiat, ...normalizedCrypto].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        // Apply pagination
        const paginatedActivity = allActivity.slice(offset, offset + limit);

        this.logger.log(`Returning ${paginatedActivity.length} activities out of ${allActivity.length} total`);

        return {
            activities: paginatedActivity,
            total: allActivity.length,
            limit,
            offset
        };
    }

    private async getFiatTransactions(userId: string, filters: { accountId?: string; from?: string; to?: string }) {
        const { accountId, from, to } = filters;
        let query = this.supabaseService.getAdminClient().from('transactions').select('*').eq('user_id', userId);

        if (accountId) query = query.eq('account_id', accountId);
        if (from) query = query.gte('created_at', from);
        if (to) query = query.lte('created_at', to);

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            this.logger.error(`Failed to fetch fiat transactions: ${error.message}`);
            return [];
        }
        return data || [];
    }

    private async getCryptoTransactions(userId: string, filters: { walletId?: string; from?: string; to?: string }) {
        const { walletId, from, to } = filters;
        let query = this.supabaseService.getAdminClient().from('crypto_transactions').select('*').eq('user_id', userId);

        if (walletId) query = query.eq('wallet_id', walletId);
        if (from) query = query.gte('created_at', from);
        if (to) query = query.lte('created_at', to);

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            this.logger.error(`Failed to fetch crypto transactions: ${error.message}`);
            return [];
        }
        return data || [];
    }

    private normalizeFiatTransaction(tx: any) {
        return {
            id: tx.id,
            source: 'fiat' as const,
            type: tx.type,
            amount: Number(tx.amount),
            currency: tx.currency,
            fee: Number(tx.fee || 0),
            fee_currency: tx.currency,
            status: tx.status,
            description: tx.description || this.getFiatDescription(tx),
            reference: tx.reference,
            created_at: tx.created_at,
            completed_at: tx.completed_at,
            metadata: {
                account_id: tx.account_id,
                balance_after: tx.balance_after,
                ...tx.metadata
            }
        };
    }

    private normalizeCryptoTransaction(tx: any) {
        const isSwap = tx.type === 'swap';
        const isBuyOrSell = tx.type === 'buy' || tx.type === 'sell';

        return {
            id: tx.id,
            source: 'crypto' as const,
            type: `crypto_${tx.type}`,
            amount: Number(tx.amount),
            currency: tx.symbol,
            fee: Number(tx.fee || 0),
            fee_currency: tx.fee_currency || tx.symbol,
            // For buy/sell, include fiat amount at top level for easy access
            ...(isBuyOrSell && {
                fiat_amount: tx.fiat_amount ? Number(tx.fiat_amount) : null,
                fiat_currency: tx.fiat_currency || 'EUR'
            }),
            status: tx.status,
            description: this.getCryptoDescription(tx),
            reference: tx.tx_hash,
            created_at: tx.created_at,
            completed_at: tx.completed_at,
            metadata: {
                wallet_id: tx.wallet_id,
                symbol: tx.symbol,
                price_per_unit: tx.price_per_unit,
                ...(isSwap && {
                    to_symbol: tx.to_symbol,
                    to_amount: tx.to_amount
                }),
                ...(tx.external_address && { external_address: tx.external_address }),
                ...(tx.network && { network: tx.network }),
                ...(tx.tx_hash && { tx_hash: tx.tx_hash })
            }
        };
    }

    private getFiatDescription(tx: any): string {
        const typeDescriptions: Record<string, string> = {
            deposit: 'Deposit',
            withdrawal: 'Withdrawal',
            transfer_in: 'Transfer received',
            transfer_out: 'Transfer sent',
            exchange_in: 'Exchange credit',
            exchange_out: 'Exchange debit',
            p2p_in: 'P2P received',
            p2p_out: 'P2P sent',
            fee: 'Fee'
        };
        return typeDescriptions[tx.type] || tx.type;
    }

    private getCryptoDescription(tx: any): string {
        switch (tx.type) {
            case 'buy':
                return `Bought ${tx.amount} ${tx.symbol}`;
            case 'sell':
                return `Sold ${tx.amount} ${tx.symbol}`;
            case 'swap':
                return `Swapped ${tx.amount} ${tx.symbol} to ${tx.to_amount} ${tx.to_symbol}`;
            case 'deposit':
                return `Deposited ${tx.amount} ${tx.symbol}`;
            case 'withdrawal':
                return `Withdrew ${tx.amount} ${tx.symbol}`;
            case 'staking':
                return `Staked ${tx.amount} ${tx.symbol}`;
            case 'unstaking':
                return `Unstaked ${tx.amount} ${tx.symbol}`;
            case 'reward':
                return `Staking reward: ${tx.amount} ${tx.symbol}`;
            default:
                return `${tx.type} ${tx.amount} ${tx.symbol}`;
        }
    }

    private generateIBAN(): string {
        const countryCode = 'GB';
        const checkDigits = '00';
        const bankCode = 'DOUN';
        const accountNumber = Math.random().toString().slice(2, 16).padEnd(14, '0');
        return `${countryCode}${checkDigits}${bankCode}${accountNumber}`;
    }
}
