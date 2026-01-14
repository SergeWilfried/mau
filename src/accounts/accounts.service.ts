import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AccountsService {
  constructor(private supabaseService: SupabaseService) {}

  async getAccounts(userId: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .order('is_main', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return { accounts: data };
  }

  async createAccount(userId: string, currency: string) {
    // Check if account with this currency already exists
    const { data: existing } = await this.supabaseService
      .getAdminClient()
      .from('accounts')
      .select('id')
      .eq('user_id', userId)
      .eq('currency', currency)
      .single();

    if (existing) {
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

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async getAccount(userId: string, accountId: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', userId)
      .single();

    if (error || !data) throw new NotFoundException('Account not found');
    return data;
  }

  async getAccountDetails(userId: string, accountId: string) {
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

    if (error) throw new BadRequestException(error.message);
    return { message: 'Main account updated successfully' };
  }

  async getTotalBalance(userId: string, targetCurrency: string = 'EUR') {
    const { data: accounts } = await this.supabaseService
      .getAdminClient()
      .from('accounts')
      .select('currency, balance')
      .eq('user_id', userId);

    // In production, would convert all balances to target currency
    const totalBalance = accounts?.reduce((sum, acc) => sum + Number(acc.balance), 0) || 0;

    return { totalBalance, currency: targetCurrency };
  }

  async getStatements(userId: string, accountId: string, from: string, to: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('transactions')
      .select('*')
      .eq('account_id', accountId)
      .eq('user_id', userId)
      .gte('created_at', from)
      .lte('created_at', to)
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return { statements: data, accountId, from, to };
  }

  async updateBalance(accountId: string, amount: number, operation: 'add' | 'subtract') {
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
      throw new BadRequestException('Insufficient funds');
    }

    const { error } = await this.supabaseService
      .getAdminClient()
      .from('accounts')
      .update({ balance: newBalance })
      .eq('id', accountId);

    if (error) throw new BadRequestException(error.message);
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
