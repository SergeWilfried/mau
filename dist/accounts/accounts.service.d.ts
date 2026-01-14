import { SupabaseService } from '../supabase/supabase.service';
export declare class AccountsService {
    private supabaseService;
    constructor(supabaseService: SupabaseService);
    getAccounts(userId: string): Promise<{
        accounts: any[];
    }>;
    createAccount(userId: string, currency: string): Promise<any>;
    getAccount(userId: string, accountId: string): Promise<any>;
    getAccountDetails(userId: string, accountId: string): Promise<{
        iban: any;
        bic: string;
        accountHolder: string;
        bankName: string;
        bankAddress: string;
        currency: any;
    }>;
    setMainAccount(userId: string, accountId: string): Promise<{
        message: string;
    }>;
    getTotalBalance(userId: string, targetCurrency?: string): Promise<{
        totalBalance: number;
        currency: string;
    }>;
    getStatements(userId: string, accountId: string, from: string, to: string): Promise<{
        statements: any[];
        accountId: string;
        from: string;
        to: string;
    }>;
    updateBalance(accountId: string, amount: number, operation: 'add' | 'subtract'): Promise<number>;
    private generateIBAN;
}
