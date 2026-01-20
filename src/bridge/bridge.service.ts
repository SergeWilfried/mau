import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

import {
    CreateWalletDto,
    WalletResponse,
    WalletBalanceDto,
    CreateCardAccountDto,
    CreateExternalAccountDto,
    CreateTransferDto,
    CreateVirtualAccountDto,
    KycLinkResponse,
    CreateKycLinkDto
} from './dto/create-bridge.dto';
import { WebhookEvent } from './types';

/**
 * Service for interacting with the Bridge.xyz API.
 * Handles the lifecycle of fiat-to-crypto bridging, card issuance, and ACH transfers.
 */
@Injectable()
export class BridgeService {
    private readonly logger = new Logger(BridgeService.name);

    handleEvent(event: WebhookEvent) {
        return this.handleWebhookEvent(event);
    }
    constructor(private readonly httpService: HttpService) {}

    /**
     * Creates a Virtual Account for a specific customer.
     * * @param customerId - The unique Bridge ID of the customer.
     * @param dto - Source currency and destination wallet details.
     * @param idempotencyKey - A unique string to prevent duplicate account creation.
     */
    async createVirtualAccount(customerId: string, dto: CreateVirtualAccountDto, idempotencyKey?: string) {
        return this.postRequest(`/customers/${customerId}/virtual_accounts`, dto, idempotencyKey);
    }

    /**
     * Issues a virtual debit card account for a customer.
     * This allows customers to spend their stablecoin balances at real-world merchants.
     * * @param customerId - The unique Bridge ID of the customer
     * @param dto - The currency (e.g., USDB), chain (e.g., ethereum), and crypto account type
     * @returns A promise resolving to the card details, status, and spendable balances
     */
    async createCardAccount(customerId: string, dto: CreateCardAccountDto) {
        return this.postRequest(`/customers/${customerId}/card_accounts`, dto);
    }

    /**
     * Links an external bank account to a Bridge customer profile.
     * This is required for off-ramping (sending funds back to a traditional bank) via ACH.
     * * @param customerId - The unique Bridge ID of the customer
     * @param dto - Bank details including account/routing numbers and owner name
     * @returns A promise resolving to the created external account object
     */
    async createExternalAccount(customerId: string, dto: CreateExternalAccountDto) {
        return this.postRequest(`/customers/${customerId}/external_accounts`, dto);
    }

    /**
     * Initiates a value transfer across the bridge.
     * This can move funds from a Virtual Account to an External Bank Account (Withdrawal/Off-ramp)
     * or between internal liquidity paths.
     * * @param dto - Source/Destination rails and the amount to be moved
     * @returns A promise resolving to the transfer state and receipt/fee breakdown
     */
    async initiateTransfer(dto: CreateTransferDto) {
        return this.postRequest(`/transfers`, dto);
    }

    /**
     * Creates a custodial wallet for a customer.
     * Note: U.S. users must have a state on file before this call.
     * @param customerId - Bridge customer ID
     * @param dto - Desired blockchain (e.g., 'solana')
     * @param idempotencyKey - Unique key to prevent duplicate wallet creation
     */
    async createWallet(customerId: string, dto: CreateWalletDto, idempotencyKey?: string): Promise<WalletResponse> {
        return this.postRequest(`/customers/${customerId}/wallets`, dto, idempotencyKey);
    }

    /**
     * Retrieves the balance of a specific wallet, including token amounts and contract addresses.
     * @param customerId - Bridge customer ID
     * @param walletId - The specific wallet UUID
     */
    async getWalletBalance(customerId: string, walletId: string): Promise<WalletResponse> {
        const response = await firstValueFrom(this.httpService.get(`/customers/${customerId}/wallets/${walletId}`));
        return response.data;
    }

    /**
     * Lists all wallets associated with a specific customer.
     */
    async listCustomerWallets(customerId: string): Promise<WalletResponse[]> {
        const response = await firstValueFrom(this.httpService.get(`/customers/${customerId}/wallets`));
        return response.data;
    }

    /**
     * Fetches the aggregate balance of all wallets across your developer account.
     */
    async getTotalBalances(): Promise<WalletBalanceDto[]> {
        const response = await firstValueFrom(this.httpService.get(`/wallets/total_balances`));
        return response.data;
    }

    private async handleWebhookEvent(event: WebhookEvent): Promise<void> {
        const { event_type, event_category, event_object_id } = event;

        switch (event_category) {
            case 'transfer':
                await this.processTransferEvent(event);
                break;

            case 'card_account':
                await this.processCardEvent(event);
                break;
            case 'kyc_link':
                this.logger.log(`KYC Link ${event_object_id} updated to: ${event.event_object_status}`);
                if (event.event_object_status === 'approved') {
                    // Unlock features like createWallet or initiateTransfer for this user
                }
                break;

            case 'customer':
                this.logger.log(`Customer ${event_object_id} was ${event_type}`);
                break;

            default:
                this.logger.warn(`Received unhandled event category: ${event_category}`);
        }
    }

    private async processTransferEvent(event: WebhookEvent) {
        const status = event.event_object_status; // e.g., 'payment_processed'
        const transferId = event.event_object_id;

        switch (status) {
            case 'funds_received':
                this.logger.log(`[Transfer ${transferId}]: Bridge received funds. Processing next steps...`);
                // Notify user their deposit was detected
                break;
            case 'virtual_account':
                await this.processVirtualAccountEvent(event);
                break;

            case 'payment_processed':
                this.logger.log(`[Transfer ${transferId}]: Success! Funds delivered to destination.`);
                // Credit internal user balance or mark order as paid
                break;

            case 'returned':
            case 'error':
                this.logger.error(`[Transfer ${transferId}]: Transfer failed with status: ${status}`);
                // Trigger refund workflow or alert support
                break;

            default:
                this.logger.debug(`[Transfer ${transferId}]: Status update - ${status}`);
        }
    }
    private async processCardEvent(event: WebhookEvent) {
        const { event_type, event_object_id } = event;

        // Triggered when a user sends stablecoins to their card's deposit address
        if (event_type === 'card_account.balance_updated') {
            const newBalance = event.event_object_status; // or extract from event data
            this.logger.log(`[Card ${event_object_id}]: Balance updated to ${newBalance}`);

            // LOGIC: Send Push Notification: "Your $100 deposit is now ready to spend!"
        }

        if (event_type === 'card_account.updated.status_transitioned') {
            this.logger.log(`[Card ${event_object_id}]: Status is now ${event.event_object_status}`);
        }
    }

    /**
     * Generates the links needed to complete KYC and ToS for a new customer.
     * This is the recommended "Quick Start" way to onboard users.
     * @param dto - Customer name, email, and type (individual/business)
     * @param idempotencyKey - Highly recommended to prevent duplicate customer creation
     */
    async createKycLink(dto: CreateKycLinkDto, idempotencyKey?: string): Promise<KycLinkResponse> {
        return this.postRequest('/kyc_links', dto, idempotencyKey);
    }

    /**
     * Retrieves the current status of a KYC link.
     * Use this to verify if a user has finished the Persona flow or accepted ToS.
     * @param kycLinkId - The 'id' returned from createKycLink (starts with 'kl_')
     */
    async getKycLinkStatus(kycLinkId: string): Promise<KycLinkResponse> {
        const response = await firstValueFrom(this.httpService.get(`/kyc_links/${kycLinkId}`));
        return response.data;
    }

    /**
     * Shared internal method to handle POST requests to the Bridge API.
     * Centralizes error handling and ensures consistent logging for debugging financial failures.
     * * @private
     * @param path - The API endpoint path (excluding the base URL)
     * @param data - The payload to be sent to the API
     * @throws {InternalServerErrorException} If the API returns a non-2xx response
     */
    private async postRequest(path: string, data: any, idempotencyKey?: string) {
        const headers = idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {};

        try {
            const response = await firstValueFrom(this.httpService.post(path, data, { headers }));
            return response.data;
        } catch (error) {
            const status = error.response?.status || 500;
            const message = error.response?.data || 'Bridge API Error';

            // Log full error for audit trails, but throw a clean NestJS exception
            console.error(`Bridge API Error [${status}]:`, JSON.stringify(message, null, 2));
            throw new InternalServerErrorException(message);
        }
    }

    private async processVirtualAccountEvent(event: WebhookEvent) {
        const type = event.event_type; // Extract the virtual account event type
        const vaId = event.event_object_id;

        switch (type) {
            case 'funds_received':
                this.logger.log(`[VA ${vaId}]: Fiat received. Conversion to crypto started.`);
                // Update DB: Mark as "Converting"
                break;

            case 'payment_processed':
                this.logger.log(`[VA ${vaId}]: Success! Crypto delivered to destination wallet.`);
                // Update DB: Mark as "Completed"
                break;

            case 'funds_scheduled':
                this.logger.log(`[VA ${vaId}]: Incoming ACH detected. Expected in 1-3 days.`);
                // Update DB: Mark as "Pending Deposit"
                break;

            case 'refunded':
                this.logger.error(`[VA ${vaId}]: Deposit failed and was returned to the user's bank.`);
                // Notify user via email/push
                break;

            case 'microdeposit':
                this.logger.log(`[VA ${vaId}]: Micro-deposits sent for bank verification.`);
                break;

            default:
                this.logger.debug(`[VA ${vaId}]: Other update - ${type}`);
        }
    }
}
