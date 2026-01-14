export declare class TransactionsController {
    getTransactions(accountId?: string, type?: string, from?: string, to?: string, limit?: number, offset?: number): {
        transactions: {
            id: string;
            type: string;
            amount: number;
            currency: string;
            description: string;
            createdAt: string;
            status: string;
        }[];
        total: number;
        limit: number;
        offset: number;
    };
    getTransaction(transactionId: string): {
        id: string;
        type: string;
        amount: number;
        currency: string;
        description: string;
        createdAt: string;
        status: string;
        fee: number;
        exchangeRate: any;
        sender: {
            name: string;
            accountId: string;
        };
        recipient: {
            name: string;
            iban: string;
        };
        reference: string;
    };
    getPendingTransactions(): {
        transactions: any[];
    };
    searchTransactions(query: string, limit?: number): {
        transactions: any[];
        query: string;
        limit: number;
    };
    getSpendingByCategory(from: string, to: string): {
        categories: {
            name: string;
            amount: number;
            percentage: number;
        }[];
    };
    getSpendingSummary(from: string, to: string, currency?: string): {
        totalIncome: number;
        totalExpenses: number;
        netBalance: number;
        currency: string;
    };
}
