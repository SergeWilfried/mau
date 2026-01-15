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
        is_main: false,
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
      currency: account.currency,
    };
  }

  async setMainAccount(userId: string, accountId: string) {
    this.logger.log(`Setting account ${accountId} as main for user ${userId}`);
    // First, unset all main accounts
    await this.supabaseService
      .getAdminClient()
      .from('accounts')
      .update({ is_main: false })
      .eq('user_id', userId);

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
    const newBalance = operation === 'add'
      ? currentBalance + amount
      : currentBalance - amount;

    if (newBalance < 0) {
      this.logger.warn(`Insufficient funds for account ${accountId}: current=${currentBalance}, requested=${amount}`);
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

  private generateIBAN(): string {
    const countryCode = 'GB';
    const checkDigits = '00';
    const bankCode = 'DOUN';
    const accountNumber = Math.random().toString().slice(2, 16).padEnd(14, '0');
    return `${countryCode}${checkDigits}${bankCode}${accountNumber}`;
  }
}
