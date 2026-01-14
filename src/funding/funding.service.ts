import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AccountsService } from '../accounts/accounts.service';
import { TransactionsService } from '../transactions/transactions.service';

@Injectable()
export class FundingService {
  constructor(
    private supabaseService: SupabaseService,
    private accountsService: AccountsService,
    private transactionsService: TransactionsService,
  ) {}

  // ==================== WIRE TRANSFER FUNDING ====================

  async initiateWireFunding(
    userId: string,
    accountId: string,
    amount: number,
    currency: string,
  ) {
    // Generate unique wire reference
    const wireReference = `DOUNI-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    // Get account details for wire instructions
    const account = await this.accountsService.getAccount(userId, accountId);
    const accountDetails = await this.accountsService.getAccountDetails(userId, accountId);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Wire instructions valid for 7 days

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

    if (error) throw new BadRequestException(error.message);

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

  // ==================== CRYPTO FUNDING ====================

  async initiateCryptoFunding(
    userId: string,
    accountId: string,
    symbol: string,
    network: string,
    expectedAmount?: number,
  ) {
    // Get or create crypto wallet for this user/symbol/network
    let { data: wallet } = await this.supabaseService
      .getAdminClient()
      .from('crypto_wallets')
      .select('*')
      .eq('user_id', userId)
      .eq('symbol', symbol)
      .eq('network', network)
      .single();

    if (!wallet) {
      // Generate deposit address (in production, use actual wallet service)
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

      if (walletError) throw new BadRequestException(walletError.message);
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

    if (error) throw new BadRequestException(error.message);

    // Network confirmations required
    const confirmations: Record<string, number> = {
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

  // ==================== MOBILE MONEY FUNDING ====================

  async initiateMobileMoneyFunding(
    userId: string,
    accountId: string,
    provider: string,
    phone: string,
    amount: number,
    currency: string,
  ) {
    // Validate provider
    const { data: providerData } = await this.supabaseService
      .getAdminClient()
      .from('mobile_money_providers')
      .select('*')
      .eq('code', provider)
      .eq('is_active', true)
      .single();

    if (!providerData) {
      throw new BadRequestException('Mobile money provider not available');
    }

    // Calculate fee (usually free for deposits or small fee)
    const fee = 0; // Most providers don't charge for deposits

    // Validate amount limits
    if (providerData.min_amount && amount < Number(providerData.min_amount)) {
      throw new BadRequestException(`Minimum amount is ${providerData.min_amount} ${providerData.currency}`);
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

    if (error) throw new BadRequestException(error.message);

    // In production, this would initiate a payment request to the mobile money API
    // For now, return instructions for manual processing or USSD code

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

  // ==================== GET FUNDING REQUESTS ====================

  async getFundingRequests(userId: string, status?: string, limit: number = 20, offset: number = 0) {
    let query = this.supabaseService
      .getAdminClient()
      .from('funding_requests')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (status) query = query.eq('status', status);

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new BadRequestException(error.message);

    return { requests: data, total: count, limit, offset };
  }

  async getFundingRequest(userId: string, fundingId: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('funding_requests')
      .select('*')
      .eq('id', fundingId)
      .eq('user_id', userId)
      .single();

    if (error || !data) throw new NotFoundException('Funding request not found');

    return data;
  }

  async cancelFundingRequest(userId: string, fundingId: string) {
    const { error } = await this.supabaseService
      .getAdminClient()
      .from('funding_requests')
      .update({ status: 'cancelled' })
      .eq('id', fundingId)
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (error) throw new BadRequestException(error.message);

    return { message: 'Funding request cancelled' };
  }

  // ==================== COMPLETE FUNDING (Internal/Admin) ====================

  async completeFunding(fundingId: string, txDetails?: { txHash?: string; txId?: string }) {
    const { data: funding } = await this.supabaseService
      .getAdminClient()
      .from('funding_requests')
      .select('*')
      .eq('id', fundingId)
      .single();

    if (!funding) throw new NotFoundException('Funding request not found');
    if (funding.status !== 'pending' && funding.status !== 'processing') {
      throw new BadRequestException('Funding request cannot be completed');
    }

    // Credit user's account
    await this.accountsService.updateBalance(funding.account_id, funding.amount, 'add');

    // Update funding request
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

    // Create transaction record
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

  // ==================== HELPER METHODS ====================

  private generateDepositAddress(symbol: string, network: string): string {
    // In production, use actual wallet generation service
    const prefix = network === 'bitcoin' ? 'bc1' : '0x';
    const randomPart = Array.from({ length: 40 }, () =>
      '0123456789abcdef'[Math.floor(Math.random() * 16)]
    ).join('');
    return `${prefix}${randomPart}`;
  }

  private getMinimumDeposit(symbol: string): number {
    const minimums: Record<string, number> = {
      BTC: 0.0001,
      ETH: 0.01,
      USDT: 10,
      USDC: 10,
      SOL: 0.1,
    };
    return minimums[symbol] || 0.01;
  }

  private getUssdCode(provider: string, amount: number): string {
    const ussdCodes: Record<string, string> = {
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
}
