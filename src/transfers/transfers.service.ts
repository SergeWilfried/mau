import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AccountsService } from '../accounts/accounts.service';
import { TransactionsService } from '../transactions/transactions.service';

@Injectable()
export class TransfersService {
  constructor(
    private supabaseService: SupabaseService,
    private accountsService: AccountsService,
    private transactionsService: TransactionsService,
  ) {}

  async internalTransfer(
    userId: string,
    fromAccountId: string,
    toAccountId: string,
    amount: number,
  ) {
    // Verify both accounts belong to user
    const fromAccount = await this.accountsService.getAccount(userId, fromAccountId);
    const toAccount = await this.accountsService.getAccount(userId, toAccountId);

    // Deduct from source account
    await this.accountsService.updateBalance(fromAccountId, amount, 'subtract');

    // Add to destination account (handle currency conversion if needed)
    await this.accountsService.updateBalance(toAccountId, amount, 'add');

    // Create transfer record
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

    if (error) throw new BadRequestException(error.message);

    // Create transaction records
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

  async p2pTransfer(
    userId: string,
    fromAccountId: string,
    recipient: string,
    recipientType: 'phone' | 'email' | 'username',
    amount: number,
    currency: string,
    note?: string,
  ) {
    // Find recipient by phone/email/username
    let recipientUser: { id: string } | null = null;

    if (recipientType === 'phone') {
      const { data } = await this.supabaseService
        .getAdminClient()
        .from('profiles')
        .select('id')
        .eq('phone', recipient)
        .single();
      recipientUser = data;
    } else if (recipientType === 'email') {
      const { data } = await this.supabaseService
        .getAdminClient()
        .from('profiles')
        .select('id')
        .eq('email', recipient)
        .single();
      recipientUser = data;
    }

    if (!recipientUser) {
      throw new NotFoundException('Recipient not found');
    }

    // Get recipient's account in the same currency
    const { data: recipientAccount } = await this.supabaseService
      .getAdminClient()
      .from('accounts')
      .select('id')
      .eq('user_id', recipientUser.id)
      .eq('currency', currency)
      .single();

    // Deduct from sender
    await this.accountsService.updateBalance(fromAccountId, amount, 'subtract');

    // Add to recipient (create account if doesn't exist)
    if (recipientAccount) {
      await this.accountsService.updateBalance(recipientAccount.id, amount, 'add');
    }

    // Create transfer record
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

    if (error) throw new BadRequestException(error.message);

    return {
      transactionId: transfer.id,
      status: 'completed',
      message: 'Money sent successfully',
    };
  }

  async bankTransfer(
    userId: string,
    fromAccountId: string,
    transferDetails: {
      beneficiaryId?: string;
      iban?: string;
      bic?: string;
      recipientName?: string;
      amount: number;
      currency: string;
      reference?: string;
      transferType: 'sepa' | 'swift';
    },
  ) {
    const fee = transferDetails.transferType === 'swift' ? 5.0 : 0;
    const totalAmount = transferDetails.amount + fee;

    // Deduct total amount from account
    await this.accountsService.updateBalance(fromAccountId, totalAmount, 'subtract');

    // Create transfer record (pending for bank transfers)
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

    if (error) throw new BadRequestException(error.message);

    // Estimate arrival
    const estimatedArrival = new Date();
    estimatedArrival.setDate(estimatedArrival.getDate() + (transferDetails.transferType === 'swift' ? 3 : 1));

    return {
      transactionId: transfer.id,
      status: 'pending',
      estimatedArrival: estimatedArrival.toISOString().split('T')[0],
      fee,
    };
  }

  async requestMoney(
    userId: string,
    recipient: string,
    recipientType: 'phone' | 'email' | 'username',
    amount: number,
    currency: string,
    note?: string,
  ) {
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

    if (error) throw new BadRequestException(error.message);

    return {
      requestId: data.id,
      status: 'pending',
      message: 'Payment request sent',
    };
  }

  async getPaymentRequests(userId: string) {
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

  async acceptPaymentRequest(userId: string, requestId: string, fromAccountId: string) {
    const { data: request } = await this.supabaseService
      .getAdminClient()
      .from('payment_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (!request) throw new NotFoundException('Payment request not found');

    // Process payment
    await this.accountsService.updateBalance(fromAccountId, request.amount, 'subtract');

    // Update request status
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

  async declinePaymentRequest(userId: string, requestId: string) {
    await this.supabaseService
      .getAdminClient()
      .from('payment_requests')
      .update({ status: 'declined' })
      .eq('id', requestId);

    return { message: 'Request declined' };
  }

  async scheduleTransfer(userId: string, details: {
    type: 'internal' | 'p2p' | 'bank';
    transferDetails: object;
    scheduledDate: string;
    recurring?: { frequency: 'daily' | 'weekly' | 'monthly'; endDate?: string };
  }) {
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

    if (error) throw new BadRequestException(error.message);

    return {
      scheduledTransferId: data.id,
      status: 'scheduled',
      nextExecutionDate: details.scheduledDate,
    };
  }

  async getScheduledTransfers(userId: string) {
    const { data } = await this.supabaseService
      .getAdminClient()
      .from('scheduled_transfers')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active');

    return { scheduledTransfers: data || [] };
  }

  async cancelScheduledTransfer(userId: string, scheduledId: string) {
    await this.supabaseService
      .getAdminClient()
      .from('scheduled_transfers')
      .update({ status: 'cancelled' })
      .eq('id', scheduledId)
      .eq('user_id', userId);

    return { message: 'Scheduled transfer cancelled' };
  }

  // ==================== CRYPTO TRANSFERS ====================

  async cryptoTransfer(
    userId: string,
    details: {
      fromWalletId: string;
      toAddress: string;
      symbol: string;
      network: string;
      amount: number;
      note?: string;
    },
  ) {
    // Verify wallet belongs to user
    const { data: wallet } = await this.supabaseService
      .getAdminClient()
      .from('crypto_wallets')
      .select('*')
      .eq('id', details.fromWalletId)
      .eq('user_id', userId)
      .single();

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (Number(wallet.balance) < details.amount) {
      throw new BadRequestException('Insufficient crypto balance');
    }

    // Calculate network fee (would be dynamic in production)
    const networkFees: Record<string, number> = {
      bitcoin: 0.0001,
      ethereum: 0.002,
      polygon: 0.001,
      solana: 0.00001,
    };
    const fee = networkFees[details.network] || 0.001;

    // Deduct from wallet
    await this.supabaseService
      .getAdminClient()
      .from('crypto_wallets')
      .update({ balance: Number(wallet.balance) - details.amount - fee })
      .eq('id', details.fromWalletId);

    // Create transfer record
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

    if (error) throw new BadRequestException(error.message);

    // Create crypto transaction record
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

  // ==================== MOBILE MONEY TRANSFERS ====================

  async mobileMoneyTransfer(
    userId: string,
    fromAccountId: string,
    details: {
      provider: string;
      phone: string;
      recipientName: string;
      amount: number;
      currency: string;
      note?: string;
    },
  ) {
    // Get provider info and fees
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

    // Validate amount limits
    if (provider.min_amount && details.amount < Number(provider.min_amount)) {
      throw new BadRequestException(`Minimum amount is ${provider.min_amount} ${provider.currency}`);
    }
    if (provider.max_amount && details.amount > Number(provider.max_amount)) {
      throw new BadRequestException(`Maximum amount is ${provider.max_amount} ${provider.currency}`);
    }

    // Deduct from account
    await this.accountsService.updateBalance(fromAccountId, totalAmount, 'subtract');

    // Create transfer record
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

    if (error) throw new BadRequestException(error.message);

    // Create transaction record
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

  // ==================== GET MOBILE MONEY PROVIDERS ====================

  async getMobileMoneyProviders(country?: string) {
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
}
