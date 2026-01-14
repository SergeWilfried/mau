import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AccountsService } from '../accounts/accounts.service';
import { TransactionsService } from '../transactions/transactions.service';

@Injectable()
export class PayoutsService {
  constructor(
    private supabaseService: SupabaseService,
    private accountsService: AccountsService,
    private transactionsService: TransactionsService,
  ) {}

  // ==================== BANK ACCOUNT PAYOUT ====================

  async initiateBankPayout(
    userId: string,
    fromAccountId: string,
    details: {
      beneficiaryId?: string;
      bankName?: string;
      accountName?: string;
      accountNumber?: string;
      iban?: string;
      bic?: string;
      routingNumber?: string;
      country: string;
      amount: number;
      currency: string;
      reference?: string;
    },
  ) {
    // Get beneficiary details if provided
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

      if (!beneficiary) throw new NotFoundException('Beneficiary not found');

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

    // Calculate fees based on destination country
    const fee = this.calculateBankPayoutFee(details.country, details.amount, details.currency);
    const totalAmount = details.amount + fee;

    // Verify sufficient balance and deduct
    await this.accountsService.updateBalance(fromAccountId, totalAmount, 'subtract');

    // Estimate arrival based on destination
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

    if (error) throw new BadRequestException(error.message);

    // Create transaction record
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

  // ==================== MOBILE MONEY PAYOUT ====================

  async initiateMobileMoneyPayout(
    userId: string,
    fromAccountId: string,
    details: {
      beneficiaryId?: string;
      provider: string;
      phone: string;
      recipientName: string;
      amount: number;
      currency: string;
      note?: string;
    },
  ) {
    // Get beneficiary if provided
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

    // Validate provider
    const { data: provider } = await this.supabaseService
      .getAdminClient()
      .from('mobile_money_providers')
      .select('*')
      .eq('code', details.provider)
      .eq('is_active', true)
      .single();

    if (!provider) {
      throw new BadRequestException('Mobile money provider not available');
    }

    // Calculate fee
    const fee = details.amount * Number(provider.fee_percentage) + Number(provider.fee_fixed || 0);
    const totalAmount = details.amount + fee;

    // Validate limits
    if (provider.min_amount && details.amount < Number(provider.min_amount)) {
      throw new BadRequestException(`Minimum payout is ${provider.min_amount} ${provider.currency}`);
    }
    if (provider.max_amount && details.amount > Number(provider.max_amount)) {
      throw new BadRequestException(`Maximum payout is ${provider.max_amount} ${provider.currency}`);
    }

    // Deduct from account
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

    if (error) throw new BadRequestException(error.message);

    // Create transaction record
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

  // ==================== GET PAYOUTS ====================

  async getPayouts(userId: string, status?: string, method?: string, limit: number = 20, offset: number = 0) {
    let query = this.supabaseService
      .getAdminClient()
      .from('payout_requests')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (status) query = query.eq('status', status);
    if (method) query = query.eq('method', method);

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new BadRequestException(error.message);

    return { payouts: data, total: count, limit, offset };
  }

  async getPayout(userId: string, payoutId: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('payout_requests')
      .select('*')
      .eq('id', payoutId)
      .eq('user_id', userId)
      .single();

    if (error || !data) throw new NotFoundException('Payout not found');

    return data;
  }

  async cancelPayout(userId: string, payoutId: string) {
    const payout = await this.getPayout(userId, payoutId);

    if (payout.status !== 'pending') {
      throw new BadRequestException('Only pending payouts can be cancelled');
    }

    // Refund the amount
    const refundAmount = Number(payout.amount) + Number(payout.fee || 0);
    await this.accountsService.updateBalance(payout.account_id, refundAmount, 'add');

    // Update status
    await this.supabaseService
      .getAdminClient()
      .from('payout_requests')
      .update({ status: 'cancelled' })
      .eq('id', payoutId);

    return { message: 'Payout cancelled and refunded' };
  }

  // ==================== PAYOUT QUOTE ====================

  async getPayoutQuote(
    method: 'bank_account' | 'mobile_money',
    details: {
      country?: string;
      provider?: string;
      amount: number;
      currency: string;
    },
  ) {
    let fee = 0;
    let estimatedTime = '';

    if (method === 'bank_account') {
      fee = this.calculateBankPayoutFee(details.country || 'EU', details.amount, details.currency);
      const arrival = this.calculateEstimatedArrival(details.country || 'EU');
      estimatedTime = `${Math.ceil((arrival.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} business days`;
    } else if (method === 'mobile_money' && details.provider) {
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
      exchangeRate: null, // Would include if currency conversion needed
    };
  }

  // ==================== GET AVAILABLE PAYOUT METHODS ====================

  async getPayoutMethods(country?: string) {
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

    // Filter by country if provided
    if (country) {
      return {
        methods: methods.filter(
          (m) => m.supportedCountries === 'all' || m.supportedCountries.includes(country),
        ),
      };
    }

    return { methods };
  }

  // ==================== HELPER METHODS ====================

  private calculateBankPayoutFee(country: string, amount: number, currency: string): number {
    // SEPA countries (EUR) - lower fees
    const sepaCountries = ['DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'PT', 'IE', 'FI', 'GR', 'LU'];

    if (sepaCountries.includes(country) && currency === 'EUR') {
      return Math.max(1, amount * 0.001); // 0.1% min €1
    }

    // UK
    if (country === 'GB') {
      return Math.max(2, amount * 0.002); // 0.2% min £2
    }

    // US
    if (country === 'US') {
      return Math.max(5, amount * 0.003); // 0.3% min $5
    }

    // Africa
    const africanCountries = ['MA', 'SN', 'CI', 'GH', 'KE', 'NG', 'ZA', 'EG'];
    if (africanCountries.includes(country)) {
      return Math.max(3, amount * 0.01); // 1% min €3
    }

    // Rest of world
    return Math.max(10, amount * 0.005); // 0.5% min €10
  }

  private calculateEstimatedArrival(country: string): Date {
    const arrival = new Date();

    // SEPA - 1 business day
    const sepaCountries = ['DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'PT', 'IE', 'FI', 'GR', 'LU'];
    if (sepaCountries.includes(country)) {
      arrival.setDate(arrival.getDate() + 1);
      return arrival;
    }

    // UK - 1-2 business days
    if (country === 'GB') {
      arrival.setDate(arrival.getDate() + 2);
      return arrival;
    }

    // US - 2-3 business days
    if (country === 'US') {
      arrival.setDate(arrival.getDate() + 3);
      return arrival;
    }

    // Africa - 2-5 business days
    const africanCountries = ['MA', 'SN', 'CI', 'GH', 'KE', 'NG', 'ZA', 'EG'];
    if (africanCountries.includes(country)) {
      arrival.setDate(arrival.getDate() + 4);
      return arrival;
    }

    // Rest of world - 3-5 business days
    arrival.setDate(arrival.getDate() + 5);
    return arrival;
  }
}
