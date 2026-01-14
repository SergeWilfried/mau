import { PayoutsService } from './payouts.service';
export declare class PayoutsController {
    private readonly payoutsService;
    constructor(payoutsService: PayoutsService);
    initiateBankPayout(user: any, body: {
        fromAccountId: string;
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
    initiateMobileMoneyPayout(user: any, body: {
        fromAccountId: string;
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
    getPayouts(user: any, status?: string, method?: string, limit?: number, offset?: number): Promise<{
        payouts: any[];
        total: number;
        limit: number;
        offset: number;
    }>;
    getPayoutQuote(method: 'bank_account' | 'mobile_money', amount: number, currency: string, country?: string, provider?: string): Promise<{
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
    getPayout(user: any, payoutId: string): Promise<any>;
    cancelPayout(user: any, payoutId: string): Promise<{
        message: string;
    }>;
}
