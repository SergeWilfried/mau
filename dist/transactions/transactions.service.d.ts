import { SupabaseService } from '../supabase/supabase.service';
export declare class TransactionsService {
    private supabaseService;
    constructor(supabaseService: SupabaseService);
    getTransactions(userId: string, filters: {
        accountId?: string;
        type?: string;
        from?: string;
        to?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        transactions: any[];
        total: number;
        limit: number;
        offset: number;
    }>;
    getTransaction(userId: string, transactionId: string): Promise<any>;
    getPendingTransactions(userId: string): Promise<{
        transactions: any[];
    }>;
    searchTransactions(userId: string, query: string, limit?: number): Promise<{
        transactions: any[];
        query: string;
        limit: number;
    }>;
    getSpendingByCategory(userId: string, from: string, to: string): Promise<{
        categories: {
            name: string;
            amount: number;
            percentage: number;
        }[];
    }>;
    getSpendingSummary(userId: string, from: string, to: string, currency?: string): Promise<{
        totalIncome: number;
        totalExpenses: number;
        netBalance: number;
        currency: string;
    }>;
    createTransaction(transaction: {
        user_id: string;
        account_id: string;
        type: string;
        amount: number;
        currency: string;
        fee?: number;
        description?: string;
        reference?: string;
        status?: string;
        metadata?: object;
        related_transaction_id?: string;
    }): Promise<any>;
    updateTransactionStatus(transactionId: string, status: string): Promise<void>;
}
