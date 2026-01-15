import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AccountsService } from '../accounts/accounts.service';

// Mock prices - in production, these would come from a price feed API
const CRYPTO_PRICES: Record<string, number> = {
  BTC: 50000.0,
  ETH: 3000.0,
  USDT: 1.0,
  SOL: 120.0,
  XRP: 0.65,
  DOGE: 0.12,
};

const CRYPTO_NAMES: Record<string, string> = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  USDT: 'Tether',
  SOL: 'Solana',
  XRP: 'Ripple',
  DOGE: 'Dogecoin',
};

@Injectable()
export class CryptoService {
  private readonly logger = new Logger(CryptoService.name);

  constructor(
    private supabaseService: SupabaseService,
    private accountsService: AccountsService,
  ) {}

  // ==================== PORTFOLIO ====================

  async getPortfolio(userId: string, currency: string = 'EUR') {
    this.logger.log(`Fetching crypto portfolio for user ${userId}`);

    const { data: wallets, error } = await this.supabaseService
      .getAdminClient()
      .from('crypto_wallets')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      this.logger.error(`Failed to fetch wallets: ${error.message}`);
      throw new BadRequestException(error.message);
    }

    const assets = (wallets || [])
      .filter((wallet) => Number(wallet.balance) > 0)
      .map((wallet) => {
        const price = CRYPTO_PRICES[wallet.symbol] || 0;
        const balance = Number(wallet.balance);
        const value = balance * price;

        return {
          symbol: wallet.symbol,
          name: CRYPTO_NAMES[wallet.symbol] || wallet.symbol,
          balance,
          value,
          price,
          network: wallet.network,
          profitLoss: 0, // Would need purchase history to calculate
          profitLossPercentage: 0,
          allocation: 0, // Calculated below
        };
      });

    const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);

    // Calculate allocation percentages
    assets.forEach((asset) => {
      asset.allocation = totalValue > 0 ? (asset.value / totalValue) * 100 : 0;
    });

    this.logger.log(`Portfolio total value for user ${userId}: ${totalValue} ${currency}`);

    return {
      totalValue,
      currency,
      totalProfitLoss: 0,
      totalProfitLossPercentage: 0,
      assets,
    };
  }

  // ==================== WALLETS ====================

  async getWallets(userId: string) {
    this.logger.log(`Fetching crypto wallets for user ${userId}`);

    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('crypto_wallets')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      this.logger.error(`Failed to fetch wallets: ${error.message}`);
      throw new BadRequestException(error.message);
    }

    return {
      wallets: data?.map((wallet) => ({
        symbol: wallet.symbol,
        network: wallet.network,
        address: wallet.address,
        balance: Number(wallet.balance),
      })) || [],
    };
  }

  async getWallet(userId: string, symbol: string, network?: string) {
    this.logger.log(`Fetching ${symbol} wallet for user ${userId}`);

    let query = this.supabaseService
      .getAdminClient()
      .from('crypto_wallets')
      .select('*')
      .eq('user_id', userId)
      .eq('symbol', symbol.toUpperCase());

    if (network) {
      query = query.eq('network', network);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      this.logger.warn(`Wallet ${symbol} not found for user ${userId}`);
      throw new NotFoundException(`Wallet for ${symbol} not found`);
    }

    return {
      symbol: data.symbol,
      network: data.network,
      address: data.address,
      balance: Number(data.balance),
      networks: [
        { name: 'Ethereum', network: 'ethereum', fee: 0.001 },
        { name: 'Polygon', network: 'polygon', fee: 0.0001 },
      ],
    };
  }

  async getOrCreateWallet(userId: string, symbol: string, network: string) {
    const { data: existing } = await this.supabaseService
      .getAdminClient()
      .from('crypto_wallets')
      .select('*')
      .eq('user_id', userId)
      .eq('symbol', symbol.toUpperCase())
      .eq('network', network)
      .single();

    if (existing) {
      return existing;
    }

    // Create new wallet
    const address = this.generateWalletAddress(symbol, network);
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('crypto_wallets')
      .insert({
        user_id: userId,
        symbol: symbol.toUpperCase(),
        network,
        address,
        balance: 0,
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to create wallet: ${error.message}`);
      throw new BadRequestException(error.message);
    }

    this.logger.log(`Created ${symbol} wallet for user ${userId}`);
    return data;
  }

  // ==================== TRADING ====================

  async buyCrypto(
    userId: string,
    symbol: string,
    fromAccountId: string,
    amount?: number,
    fiatAmount?: number,
  ) {
    this.logger.log(`Buy crypto request: user=${userId}, symbol=${symbol}, amount=${amount}, fiatAmount=${fiatAmount}`);

    const price = CRYPTO_PRICES[symbol.toUpperCase()];
    if (!price) {
      throw new BadRequestException(`Unsupported cryptocurrency: ${symbol}`);
    }

    // Calculate amounts
    let cryptoAmount: number;
    let fiatTotal: number;
    const feePercentage = 0.01; // 1% fee

    if (fiatAmount) {
      fiatTotal = fiatAmount;
      const fiatAfterFee = fiatAmount * (1 - feePercentage);
      cryptoAmount = fiatAfterFee / price;
    } else if (amount) {
      cryptoAmount = amount;
      fiatTotal = (amount * price) / (1 - feePercentage);
    } else {
      throw new BadRequestException('Either amount or fiatAmount must be provided');
    }

    const fee = fiatTotal * feePercentage;

    // Verify and deduct from fiat account
    this.logger.log(`Deducting ${fiatTotal} from account ${fromAccountId}`);
    await this.accountsService.updateBalance(fromAccountId, fiatTotal, 'subtract');

    // Get or create crypto wallet and credit it
    const network = this.getDefaultNetwork(symbol);
    const wallet = await this.getOrCreateWallet(userId, symbol, network);

    const newBalance = Number(wallet.balance) + cryptoAmount;
    const { error: updateError } = await this.supabaseService
      .getAdminClient()
      .from('crypto_wallets')
      .update({ balance: newBalance })
      .eq('id', wallet.id);

    if (updateError) {
      // Rollback fiat deduction
      await this.accountsService.updateBalance(fromAccountId, fiatTotal, 'add');
      this.logger.error(`Failed to update wallet balance: ${updateError.message}`);
      throw new BadRequestException('Failed to complete purchase');
    }

    // Record transaction
    const { data: transaction, error: txError } = await this.supabaseService
      .getAdminClient()
      .from('crypto_transactions')
      .insert({
        user_id: userId,
        wallet_id: wallet.id,
        type: 'buy',
        symbol: symbol.toUpperCase(),
        amount: cryptoAmount,
        price_per_unit: price,
        fiat_amount: fiatTotal,
        fiat_currency: 'EUR', // Would come from account currency
        fee,
        fee_currency: 'EUR',
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (txError) {
      this.logger.error(`Failed to record transaction: ${txError.message}`);
      // Transaction completed but not recorded - log for reconciliation
    }

    this.logger.log(`Buy completed: ${cryptoAmount} ${symbol} for ${fiatTotal} EUR`);

    return {
      transactionId: transaction?.id || 'unknown',
      type: 'buy',
      symbol: symbol.toUpperCase(),
      amount: cryptoAmount,
      price,
      fiatAmount: fiatTotal,
      fee,
      status: 'completed',
      executedAt: new Date().toISOString(),
    };
  }

  async sellCrypto(
    userId: string,
    symbol: string,
    toAccountId: string,
    amount?: number,
    fiatAmount?: number,
  ) {
    this.logger.log(`Sell crypto request: user=${userId}, symbol=${symbol}, amount=${amount}, fiatAmount=${fiatAmount}`);

    const price = CRYPTO_PRICES[symbol.toUpperCase()];
    if (!price) {
      throw new BadRequestException(`Unsupported cryptocurrency: ${symbol}`);
    }

    // Calculate amounts
    let cryptoAmount: number;
    let fiatTotal: number;
    const feePercentage = 0.01; // 1% fee

    if (amount) {
      cryptoAmount = amount;
      fiatTotal = amount * price * (1 - feePercentage);
    } else if (fiatAmount) {
      fiatTotal = fiatAmount;
      cryptoAmount = fiatAmount / (price * (1 - feePercentage));
    } else {
      throw new BadRequestException('Either amount or fiatAmount must be provided');
    }

    const fee = cryptoAmount * price * feePercentage;

    // Get wallet and verify balance
    const network = this.getDefaultNetwork(symbol);
    const { data: wallet, error: walletError } = await this.supabaseService
      .getAdminClient()
      .from('crypto_wallets')
      .select('*')
      .eq('user_id', userId)
      .eq('symbol', symbol.toUpperCase())
      .eq('network', network)
      .single();

    if (walletError || !wallet) {
      throw new BadRequestException(`No ${symbol} wallet found`);
    }

    const currentBalance = Number(wallet.balance);
    if (currentBalance < cryptoAmount) {
      this.logger.warn(`Insufficient ${symbol} balance: ${currentBalance} < ${cryptoAmount}`);
      throw new BadRequestException(`Insufficient ${symbol} balance`);
    }

    // Deduct from crypto wallet
    const newBalance = currentBalance - cryptoAmount;
    const { error: updateError } = await this.supabaseService
      .getAdminClient()
      .from('crypto_wallets')
      .update({ balance: newBalance })
      .eq('id', wallet.id);

    if (updateError) {
      this.logger.error(`Failed to update wallet balance: ${updateError.message}`);
      throw new BadRequestException('Failed to complete sale');
    }

    // Credit fiat account
    try {
      await this.accountsService.updateBalance(toAccountId, fiatTotal, 'add');
    } catch (error) {
      // Rollback crypto deduction
      await this.supabaseService
        .getAdminClient()
        .from('crypto_wallets')
        .update({ balance: currentBalance })
        .eq('id', wallet.id);
      throw error;
    }

    // Record transaction
    const { data: transaction, error: txError } = await this.supabaseService
      .getAdminClient()
      .from('crypto_transactions')
      .insert({
        user_id: userId,
        wallet_id: wallet.id,
        type: 'sell',
        symbol: symbol.toUpperCase(),
        amount: cryptoAmount,
        price_per_unit: price,
        fiat_amount: fiatTotal,
        fiat_currency: 'EUR',
        fee,
        fee_currency: 'EUR',
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (txError) {
      this.logger.error(`Failed to record transaction: ${txError.message}`);
    }

    this.logger.log(`Sell completed: ${cryptoAmount} ${symbol} for ${fiatTotal} EUR`);

    return {
      transactionId: transaction?.id || 'unknown',
      type: 'sell',
      symbol: symbol.toUpperCase(),
      amount: cryptoAmount,
      price,
      fiatAmount: fiatTotal,
      fee,
      status: 'completed',
      executedAt: new Date().toISOString(),
    };
  }

  async swapCrypto(
    userId: string,
    fromSymbol: string,
    toSymbol: string,
    fromAmount?: number,
    toAmount?: number,
  ) {
    this.logger.log(`Swap crypto request: user=${userId}, from=${fromSymbol}, to=${toSymbol}`);

    const fromPrice = CRYPTO_PRICES[fromSymbol.toUpperCase()];
    const toPrice = CRYPTO_PRICES[toSymbol.toUpperCase()];

    if (!fromPrice || !toPrice) {
      throw new BadRequestException('Unsupported cryptocurrency');
    }

    const feePercentage = 0.005; // 0.5% fee
    let fromCryptoAmount: number;
    let toCryptoAmount: number;

    if (fromAmount) {
      fromCryptoAmount = fromAmount;
      const valueInFiat = fromAmount * fromPrice * (1 - feePercentage);
      toCryptoAmount = valueInFiat / toPrice;
    } else if (toAmount) {
      toCryptoAmount = toAmount;
      const valueInFiat = toAmount * toPrice / (1 - feePercentage);
      fromCryptoAmount = valueInFiat / fromPrice;
    } else {
      throw new BadRequestException('Either fromAmount or toAmount must be provided');
    }

    // Get source wallet and verify balance
    const fromNetwork = this.getDefaultNetwork(fromSymbol);
    const { data: fromWallet, error: fromError } = await this.supabaseService
      .getAdminClient()
      .from('crypto_wallets')
      .select('*')
      .eq('user_id', userId)
      .eq('symbol', fromSymbol.toUpperCase())
      .eq('network', fromNetwork)
      .single();

    if (fromError || !fromWallet) {
      throw new BadRequestException(`No ${fromSymbol} wallet found`);
    }

    const fromBalance = Number(fromWallet.balance);
    if (fromBalance < fromCryptoAmount) {
      throw new BadRequestException(`Insufficient ${fromSymbol} balance`);
    }

    // Get or create destination wallet
    const toNetwork = this.getDefaultNetwork(toSymbol);
    const toWallet = await this.getOrCreateWallet(userId, toSymbol, toNetwork);

    // Deduct from source wallet
    const newFromBalance = fromBalance - fromCryptoAmount;
    await this.supabaseService
      .getAdminClient()
      .from('crypto_wallets')
      .update({ balance: newFromBalance })
      .eq('id', fromWallet.id);

    // Credit destination wallet
    const newToBalance = Number(toWallet.balance) + toCryptoAmount;
    await this.supabaseService
      .getAdminClient()
      .from('crypto_wallets')
      .update({ balance: newToBalance })
      .eq('id', toWallet.id);

    // Record transaction
    const { data: transaction } = await this.supabaseService
      .getAdminClient()
      .from('crypto_transactions')
      .insert({
        user_id: userId,
        wallet_id: fromWallet.id,
        type: 'swap',
        symbol: fromSymbol.toUpperCase(),
        amount: fromCryptoAmount,
        price_per_unit: fromPrice,
        swap_to_symbol: toSymbol.toUpperCase(),
        swap_to_amount: toCryptoAmount,
        fee: fromCryptoAmount * feePercentage,
        fee_currency: fromSymbol.toUpperCase(),
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    this.logger.log(`Swap completed: ${fromCryptoAmount} ${fromSymbol} -> ${toCryptoAmount} ${toSymbol}`);

    return {
      transactionId: transaction?.id || 'unknown',
      type: 'swap',
      fromSymbol: fromSymbol.toUpperCase(),
      toSymbol: toSymbol.toUpperCase(),
      fromAmount: fromCryptoAmount,
      toAmount: toCryptoAmount,
      rate: toPrice / fromPrice,
      fee: fromCryptoAmount * feePercentage,
      status: 'completed',
      executedAt: new Date().toISOString(),
    };
  }

  // ==================== TRANSACTIONS ====================

  async getTransactions(
    userId: string,
    symbol?: string,
    type?: string,
    limit: number = 20,
    offset: number = 0,
  ) {
    this.logger.log(`Fetching crypto transactions for user ${userId}`);

    let query = this.supabaseService
      .getAdminClient()
      .from('crypto_transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (symbol) {
      query = query.eq('symbol', symbol.toUpperCase());
    }

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error, count } = await query;

    if (error) {
      this.logger.error(`Failed to fetch transactions: ${error.message}`);
      throw new BadRequestException(error.message);
    }

    return {
      transactions: data?.map((tx) => ({
        id: tx.id,
        type: tx.type,
        symbol: tx.symbol,
        amount: Number(tx.amount),
        price: Number(tx.price_per_unit),
        fiatAmount: Number(tx.fiat_amount),
        fee: Number(tx.fee),
        status: tx.status,
        createdAt: tx.created_at,
      })) || [],
      total: count || 0,
      limit,
      offset,
    };
  }

  async getTransaction(userId: string, transactionId: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('crypto_transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Transaction not found');
    }

    return {
      id: data.id,
      type: data.type,
      symbol: data.symbol,
      amount: Number(data.amount),
      price: Number(data.price_per_unit),
      fiatAmount: Number(data.fiat_amount),
      fee: Number(data.fee),
      status: data.status,
      txHash: data.tx_hash,
      createdAt: data.created_at,
    };
  }

  // ==================== HELPERS ====================

  private getDefaultNetwork(symbol: string): string {
    const networks: Record<string, string> = {
      BTC: 'bitcoin',
      ETH: 'ethereum',
      USDT: 'ethereum',
      SOL: 'solana',
      XRP: 'ripple',
      DOGE: 'dogecoin',
    };
    return networks[symbol.toUpperCase()] || 'ethereum';
  }

  private generateWalletAddress(symbol: string, network: string): string {
    const prefix = network === 'bitcoin' ? 'bc1q' : '0x';
    const randomPart = Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    return prefix + randomPart;
  }

  getPrice(symbol: string): number {
    return CRYPTO_PRICES[symbol.toUpperCase()] || 0;
  }

  getPrices(symbols?: string[], currency: string = 'EUR') {
    const prices: Record<string, { price: number; change24h: number }> = {};
    const symbolList = symbols || Object.keys(CRYPTO_PRICES);

    for (const symbol of symbolList) {
      const upperSymbol = symbol.toUpperCase();
      if (CRYPTO_PRICES[upperSymbol]) {
        prices[upperSymbol] = {
          price: CRYPTO_PRICES[upperSymbol],
          change24h: Math.random() * 10 - 5, // Mock change
        };
      }
    }

    return {
      currency,
      prices,
      timestamp: new Date().toISOString(),
    };
  }
}
