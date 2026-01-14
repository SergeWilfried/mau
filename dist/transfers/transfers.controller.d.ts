import { TransfersService } from './transfers.service';
export declare class TransfersController {
    private readonly transfersService;
    constructor(transfersService: TransfersService);
    internalTransfer(user: any, body: {
        fromAccountId: string;
        toAccountId: string;
        amount: number;
    }): Promise<{
        transactionId: any;
        status: string;
        message: string;
    }>;
    p2pTransfer(user: any, body: {
        fromAccountId: string;
        recipient: string;
        recipientType: 'phone' | 'email' | 'username';
        amount: number;
        currency: string;
        note?: string;
    }): Promise<{
        transactionId: any;
        status: string;
        message: string;
    }>;
    cryptoTransfer(user: any, body: {
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
    mobileMoneyTransfer(user: any, body: {
        fromAccountId: string;
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
    bankTransfer(user: any, body: {
        fromAccountId: string;
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
    requestMoney(user: any, body: {
        recipient: string;
        recipientType: 'phone' | 'email' | 'username';
        amount: number;
        currency: string;
        note?: string;
    }): Promise<{
        requestId: any;
        status: string;
        message: string;
    }>;
    getPaymentRequests(user: any): Promise<{
        incoming: any[];
        outgoing: any[];
    }>;
    acceptRequest(user: any, requestId: string, body: {
        fromAccountId: string;
    }): Promise<{
        transactionId: string;
        status: string;
        message: string;
    }>;
    declineRequest(user: any, requestId: string): Promise<{
        message: string;
    }>;
    scheduleTransfer(user: any, body: {
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
    getScheduledTransfers(user: any): Promise<{
        scheduledTransfers: any[];
    }>;
    cancelScheduledTransfer(user: any, id: string): Promise<{
        message: string;
    }>;
}
