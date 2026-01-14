import { SupabaseService } from '../supabase/supabase.service';
import { AccountsService } from '../accounts/accounts.service';
import { TransactionsService } from '../transactions/transactions.service';
export declare class FundingService {
    private supabaseService;
    private accountsService;
    private transactionsService;
    constructor(supabaseService: SupabaseService, accountsService: AccountsService, transactionsService: TransactionsService);
    initiateWireFunding(userId: string, accountId: string, amount: number, currency: string): Promise<{
        fundingId: any;
        method: string;
        status: string;
        wireInstructions: {
            reference: string;
            amount: number;
            currency: string;
            beneficiaryName: string;
            beneficiaryIban: any;
            beneficiaryBic: string;
            bankName: string;
            bankAddress: string;
            importantNotes: string[];
        };
        expiresAt: string;
    }>;
    initiateCryptoFunding(userId: string, accountId: string, symbol: string, network: string, expectedAmount?: number): Promise<{
        fundingId: any;
        method: string;
        status: string;
        depositDetails: {
            address: any;
            symbol: string;
            network: string;
            minimumDeposit: number;
            confirmationsRequired: number;
            qrCode: string;
            warnings: string[];
        };
    }>;
    initiateMobileMoneyFunding(userId: string, accountId: string, provider: string, phone: string, amount: number, currency: string): Promise<{
        fundingId: any;
        method: string;
        status: string;
        provider: any;
        amount: number;
        currency: string;
        fee: number;
        instructions: {
            ussdCode: string;
            steps: string[];
            merchantCode: string;
            reference: any;
        };
        estimatedTime: string;
    }>;
    getFundingRequests(userId: string, status?: string, limit?: number, offset?: number): Promise<{
        requests: any[];
        total: number;
        limit: number;
        offset: number;
    }>;
    getFundingRequest(userId: string, fundingId: string): Promise<any>;
    cancelFundingRequest(userId: string, fundingId: string): Promise<{
        message: string;
    }>;
    completeFunding(fundingId: string, txDetails?: {
        txHash?: string;
        txId?: string;
    }): Promise<{
        message: string;
    }>;
    private generateDepositAddress;
    private getMinimumDeposit;
    private getUssdCode;
}
