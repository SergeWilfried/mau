export declare class ExchangeController {
    getRates(base?: string): {
        base: string;
        timestamp: string;
        rates: {
            USD: number;
            GBP: number;
            MAD: number;
            CHF: number;
            JPY: number;
            CAD: number;
        };
    };
    getRate(from: string, to: string, amount?: number): {
        from: string;
        to: string;
        rate: number;
        amount: number;
        convertedAmount: number;
        fee: number;
        timestamp: string;
    };
    convert(body: {
        fromAccountId: string;
        toAccountId: string;
        fromAmount?: number;
        toAmount?: number;
    }): {
        transactionId: string;
        fromAmount: number;
        fromCurrency: string;
        toAmount: number;
        toCurrency: string;
        rate: number;
        fee: number;
        status: string;
    };
    getQuote(body: {
        fromCurrency: string;
        toCurrency: string;
        fromAmount?: number;
        toAmount?: number;
    }): {
        fromCurrency: string;
        toCurrency: string;
        fromAmount: number;
        toAmount: number;
        rate: number;
        fee: number;
        expiresAt: string;
        quoteId: string;
    };
    executeQuote(body: {
        quoteId: string;
        fromAccountId: string;
        toAccountId: string;
    }): {
        transactionId: string;
        status: string;
        message: string;
    };
    getSupportedCurrencies(): {
        currencies: {
            code: string;
            name: string;
            symbol: string;
        }[];
    };
    getExchangeHistory(limit?: number, offset?: number): {
        exchanges: any[];
        total: number;
        limit: number;
        offset: number;
    };
}
