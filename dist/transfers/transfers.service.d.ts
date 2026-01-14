import { SupabaseService } from '../supabase/supabase.service';
import { AccountsService } from '../accounts/accounts.service';
import { TransactionsService } from '../transactions/transactions.service';
export declare class TransfersService {
    private supabaseService;
    private accountsService;
    private transactionsService;
    constructor(supabaseService: SupabaseService, accountsService: AccountsService, transactionsService: TransactionsService);
    internalTransfer(userId: string, fromAccountId: string, toAccountId: string, amount: number): Promise<{
        transactionId: any;
        status: string;
        message: string;
    }>;
    p2pTransfer(userId: string, fromAccountId: string, recipient: string, recipientType: 'phone' | 'email' | 'username', amount: number, currency: string, note?: string): Promise<{
        transactionId: any;
        status: string;
        message: string;
    }>;
    bankTransfer(userId: string, fromAccountId: string, transferDetails: {
        beneficiaryId?: string;
        iban?: string;
        bic?: string;
        recipientName?: string;
        amount: number;
        currency: string;
        reference?: string;
        transferType: 'sepa' | 'swift';
    }): Promise<{
        transactionId: any;
        status: string;
        estimatedArrival: string;
        fee: number;
    }>;
    requestMoney(userId: string, recipient: string, recipientType: 'phone' | 'email' | 'username', amount: number, currency: string, note?: string): Promise<{
        requestId: any;
        status: string;
        message: string;
    }>;
    getPaymentRequests(userId: string): Promise<{
        incoming: any[];
        outgoing: any[];
    }>;
    acceptPaymentRequest(userId: string, requestId: string, fromAccountId: string): Promise<{
        transactionId: string;
        status: string;
        message: string;
    }>;
    declinePaymentRequest(userId: string, requestId: string): Promise<{
        message: string;
    }>;
    scheduleTransfer(userId: string, details: {
        type: 'internal' | 'p2p' | 'bank';
        transferDetails: object;
        scheduledDate: string;
        recurring?: {
            frequency: 'daily' | 'weekly' | 'monthly';
            endDate?: string;
        };
    }): Promise<{
        scheduledTransferId: any;
        status: string;
        nextExecutionDate: string;
    }>;
    getScheduledTransfers(userId: string): Promise<{
        scheduledTransfers: any[];
    }>;
    cancelScheduledTransfer(userId: string, scheduledId: string): Promise<{
        message: string;
    }>;
    cryptoTransfer(userId: string, details: {
        fromWalletId: string;
        toAddress: string;
        symbol: string;
        network: string;
        amount: number;
        note?: string;
    }): Promise<{
        transferId: any;
        status: string;
        fee: number;
        feeCurrency: string;
        estimatedTime: string;
        message: string;
    }>;
    mobileMoneyTransfer(userId: string, fromAccountId: string, details: {
        provider: string;
        phone: string;
        recipientName: string;
        amount: number;
        currency: string;
        note?: string;
    }): Promise<{
        transferId: any;
        status: string;
        fee: number;
        totalAmount: number;
        estimatedTime: string;
        message: string;
    }>;
    getMobileMoneyProviders(country?: string): Promise<{
        providers: any[];
    }>;
}
