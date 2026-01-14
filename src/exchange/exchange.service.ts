import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AccountsService } from '../accounts/accounts.service';
import { TransactionsService } from '../transactions/transactions.service';

@Injectable()
export class ExchangeService {
  constructor(
    private supabaseService: SupabaseService,
    private accountsService: AccountsService,
    private transactionsService: TransactionsService,
  ) {}

  // In production, fetch from external API
  private mockRates: Record<string, Record<string, number>> = {
    EUR: { USD: 1.08, GBP: 0.86, MAD: 10.85, CHF: 0.94, JPY: 162.5, CAD: 1.47 },
    USD: { EUR: 0.93, GBP: 0.80, MAD: 10.05, CHF: 0.87, JPY: 150.5, CAD: 1.36 },
    GBP: { EUR: 1.16, USD: 1.25, MAD: 12.60, CHF: 1.09, JPY: 188.7, CAD: 1.70 },
  };

  async getRates(base: string = 'EUR') {
    // In production, fetch from cache or external API
    const { data: cachedRates } = await this.supabaseService
      .getAdminClient()
      .from('exchange_rates')
      .select('target_currency, rate')
      .eq('base_currency', base);

    let rates: Record<string, number> = {};

    if (cachedRates && cachedRates.length > 0) {
      cachedRates.forEach((r) => {
        rates[r.target_currency] = r.rate;
      });
    } else {
      rates = this.mockRates[base] || {};
    }

    return {
      base,
      timestamp: new Date().toISOString(),
      rates,
    };
  }

  async getRate(from: string, to: string, amount: number = 1) {
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

  async getQuote(body: {
    fromCurrency: string;
    toCurrency: string;
    fromAmount?: number;
    toAmount?: number;
  }) {
    const rate = (await this.getRate(body.fromCurrency, body.toCurrency)).rate;

    let fromAmount: number;
    let toAmount: number;

    if (body.fromAmount) {
      fromAmount = body.fromAmount;
      toAmount = fromAmount * rate;
    } else if (body.toAmount) {
      toAmount = body.toAmount;
      fromAmount = toAmount / rate;
    } else {
      fromAmount = 100;
      toAmount = fromAmount * rate;
    }

    const fee = fromAmount * 0.005; // 0.5% fee

    // Store quote temporarily (in production, use Redis with TTL)
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

  async convert(
    userId: string,
    fromAccountId: string,
    toAccountId: string,
    fromAmount?: number,
    toAmount?: number,
  ) {
    const fromAccount = await this.accountsService.getAccount(userId, fromAccountId);
    const toAccount = await this.accountsService.getAccount(userId, toAccountId);

    const rateInfo = await this.getRate(fromAccount.currency, toAccount.currency, fromAmount || 100);

    const actualFromAmount = fromAmount || (toAmount ? toAmount / rateInfo.rate : 100);
    const actualToAmount = toAmount || actualFromAmount * rateInfo.rate;
    const fee = actualFromAmount * 0.005;

    // Deduct from source account (including fee)
    await this.accountsService.updateBalance(fromAccountId, actualFromAmount + fee, 'subtract');

    // Add to destination account
    await this.accountsService.updateBalance(toAccountId, actualToAmount, 'add');

    // Create transaction records
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

  async getExchangeHistory(userId: string, limit: number = 20, offset: number = 0) {
    const { data, error, count } = await this.supabaseService
      .getAdminClient()
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .in('type', ['exchange_in', 'exchange_out'])
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new BadRequestException(error.message);

    return { exchanges: data, total: count, limit, offset };
  }
}
