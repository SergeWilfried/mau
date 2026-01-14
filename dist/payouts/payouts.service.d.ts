import { SupabaseService } from '../supabase/supabase.service';
import { AccountsService } from '../accounts/accounts.service';
import { TransactionsService } from '../transactions/transactions.service';
export declare class PayoutsService {
    private supabaseService;
    private accountsService;
    private transactionsService;
    constructor(supabaseService: SupabaseService, accountsService: AccountsService, transactionsService: TransactionsService);
    initiateBankPayout(userId: string, fromAccountId: string, details: {
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
    }): Promise<{
        payoutId: any;
        method: string;
        status: string;
        amount: number;
        fee: number;
        totalDeducted: number;
        currency: string;
        estimatedArrival: string;
        recipient: {
            name: string;
            bank: string;
            country: string;
        };
    }>;
    initiateMobileMoneyPayout(userId: string, fromAccountId: string, details: {
        beneficiaryId?: string;
        provider: string;
        phone: string;
        recipientName: string;
        amount: number;
        currency: string;
        note?: string;
    }): Promise<{
        payoutId: any;
        method: string;
        status: string;
        amount: number;
        fee: number;
        totalDeducted: number;
        currency: string;
        estimatedTime: string;
        recipient: {
            name: string;
            phone: string;
            provider: any;
        };
    }>;
    getPayouts(userId: string, status?: string, method?: string, limit?: number, offset?: number): Promise<{
        payouts: any[];
        total: number;
        limit: number;
        offset: number;
    }>;
    getPayout(userId: string, payoutId: string): Promise<any>;
    cancelPayout(userId: string, payoutId: string): Promise<{
        message: string;
    }>;
    getPayoutQuote(method: 'bank_account' | 'mobile_money', details: {
        country?: string;
        provider?: string;
        amount: number;
        currency: string;
    }): Promise<{
        method: "mobile_money" | "bank_account";
        amount: number;
        fee: number;
        totalAmount: number;
        currency: string;
        estimatedTime: string;
        exchangeRate: any;
    }>;
    getPayoutMethods(country?: string): Promise<{
        methods: ({
            id: string;
            name: string;
            description: string;
            supportedCountries: string;
            minAmount: number;
            maxAmount: number;
            estimatedTime: string;
            requiredFields: string[];
        } | {
            id: string;
            name: string;
            description: string;
            supportedCountries: string[];
            minAmount: number;
            maxAmount: number;
            estimatedTime: string;
            requiredFields: string[];
        })[];
    }>;
    private calculateBankPayoutFee;
    private calculateEstimatedArrival;
}
