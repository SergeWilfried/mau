import { FundingService } from './funding.service';
export declare class FundingController {
    private readonly fundingService;
    constructor(fundingService: FundingService);
    initiateWireFunding(user: any, body: {
        accountId: string;
        amount: number;
        currency: string;
    }): Promise<{
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
    initiateCryptoFunding(user: any, body: {
        accountId: string;
        symbol: string;
        network: string;
        expectedAmount?: number;
    }): Promise<{
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
    initiateMobileMoneyFunding(user: any, body: {
        accountId: string;
        provider: string;
        phone: string;
        amount: number;
        currency: string;
    }): Promise<{
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
    getFundingRequests(user: any, status?: string, limit?: number, offset?: number): Promise<{
        requests: any[];
        total: number;
        limit: number;
        offset: number;
    }>;
    getFundingRequest(user: any, fundingId: string): Promise<any>;
    cancelFundingRequest(user: any, fundingId: string): Promise<{
        message: string;
    }>;
    getAvailableMethods(country?: string): {
        methods: ({
            id: string;
            name: string;
            description: string;
            minAmount: number;
            maxAmount: number;
            fee: number;
            estimatedTime: string;
            currencies: string[];
            supportedCoins?: undefined;
            availableCountries?: undefined;
        } | {
            id: string;
            name: string;
            description: string;
            minAmount: number;
            maxAmount: any;
            fee: number;
            estimatedTime: string;
            supportedCoins: string[];
            currencies?: undefined;
            availableCountries?: undefined;
        } | {
            id: string;
            name: string;
            description: string;
            minAmount: number;
            maxAmount: number;
            fee: number;
            estimatedTime: string;
            availableCountries: string[];
            currencies?: undefined;
            supportedCoins?: undefined;
        })[];
    };
}
