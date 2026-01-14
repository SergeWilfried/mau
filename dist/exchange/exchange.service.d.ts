import { SupabaseService } from '../supabase/supabase.service';
import { AccountsService } from '../accounts/accounts.service';
import { TransactionsService } from '../transactions/transactions.service';
export declare class ExchangeService {
    private supabaseService;
    private accountsService;
    private transactionsService;
    constructor(supabaseService: SupabaseService, accountsService: AccountsService, transactionsService: TransactionsService);
    private mockRates;
    getRates(base?: string): Promise<{
        base: string;
        timestamp: string;
        rates: Record<string, number>;
    }>;
    getRate(from: string, to: string, amount?: number): Promise<{
        from: string;
        to: string;
        rate: number;
        amount: number;
        convertedAmount: number;
        fee: number;
        timestamp: string;
    }>;
    getQuote(body: {
        fromCurrency: string;
        toCurrency: string;
        fromAmount?: number;
        toAmount?: number;
    }): Promise<{
        fromCurrency: string;
        toCurrency: string;
        fromAmount: number;
        toAmount: number;
        rate: number;
        fee: number;
        expiresAt: string;
        quoteId: string;
    }>;
    convert(userId: string, fromAccountId: string, toAccountId: string, fromAmount?: number, toAmount?: number): Promise<{
        transactionId: any;
        fromAmount: number;
        fromCurrency: any;
        toAmount: number;
        toCurrency: any;
        rate: number;
        fee: number;
        status: string;
    }>;
    getSupportedCurrencies(): Promise<{
        currencies: {
            code: string;
            name: string;
            symbol: string;
        }[];
    }>;
    getExchangeHistory(userId: string, limit?: number, offset?: number): Promise<{
        exchanges: any[];
        total: number;
        limit: number;
        offset: number;
    }>;
}
