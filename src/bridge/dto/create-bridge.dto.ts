import { Type } from 'class-transformer';
import {
    IsString,
    IsArray,
    IsNumber,
    IsObject,
    ValidateNested,
    IsOptional,
    IsEnum,
    IsNotEmpty,
    IsUrl,
    IsBoolean,
    IsNumberString,
    IsEmail
} from 'class-validator';

export class CardFundingInstructionsDto {
    @IsString()
    address: string; // The deposit address for the card

    @IsString()
    currency: string; // e.g., "usdc"

    @IsString()
    chain: string; // e.g., "base" or "polygon"
}

export class CardAccountResponseDto {
    id: string;
    status: string;

    @Type(() => CardFundingInstructionsDto)
    funding_instructions: CardFundingInstructionsDto;

    @IsString()
    top_up_balance: string; // The current spendable amount
}

export class CreateKycLinkDto {
    @IsString()
    @IsNotEmpty()
    full_name: string;

    @IsEmail()
    email: string;

    @IsEnum(['individual', 'business'])
    type: 'individual' | 'business';
}

export interface KycLinkResponse {
    id: string;
    full_name: string;
    email: string;
    type: 'individual' | 'business';
    kyc_link: string;
    tos_link: string;
    kyc_status: 'not_started' | 'incomplete' | 'under_review' | 'approved' | 'rejected';
    tos_status: 'pending' | 'approved';
    customer_id: string;
    created_at: string;
}
/**
 * Request to create a new custodial wallet
 */
export class CreateWalletDto {
    @IsString()
    @IsNotEmpty()
    chain: 'ethereum' | 'solana' | 'polygon' | 'base'; // Bridge supports these common chains
}

/**
 * Individual balance entry within a wallet
 */
export class WalletBalanceDto {
    @IsString()
    balance: string;

    @IsString()
    currency: string;

    @IsString()
    chain: string;

    @IsString()
    @IsOptional()
    contract_address?: string;
}

export class TransferDestinationDto {
    @IsString()
    payment_rail: string; // e.g., "solana"

    @IsString()
    currency: string; // e.g., "usdb"

    @IsOptional()
    @IsString()
    address?: string; // External wallet

    @IsOptional()
    @IsString()
    bridge_wallet_id?: string; // Internal Bridge custodial wallet
}
/**
 * Full Wallet Response
 */
export class WalletResponse {
    id: string;
    chain: string;
    address: string;
    created_at: string;
    updated_at: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => WalletBalanceDto)
    balances?: WalletBalanceDto[];
}

export abstract class BaseBridgeResponse {
    id: string;
    created_at: string;
    updated_at: string;
}

// --- SHARED / SUB-RESOURCES ---

export class CryptoAccountDto {
    @IsEnum(['standard', 'managed'])
    account_type: string;

    @IsString()
    @IsNotEmpty()
    address: string;
}

export class DestinationDto {
    @IsString()
    currency: string;

    @IsString()
    payment_rail: string;

    @IsString()
    address: string;
}

// --- CARD ACCOUNTS ---

export class CreateCardAccountDto {
    @IsString()
    currency: string;

    @IsString()
    chain: string;

    @IsObject()
    @ValidateNested()
    @Type(() => CryptoAccountDto)
    crypto_account: CryptoAccountDto;
}

// --- EXTERNAL ACCOUNTS (Bank Link) ---

export class ExternalAccountDetailDto {
    @IsNumber()
    account_number: number;

    @IsNumber()
    routing_number: number;

    @IsEnum(['checking', 'savings'])
    checking_or_savings: string;
}

export class CreateExternalAccountDto {
    @IsString()
    account_owner_name: string;

    @IsString()
    bank_name: string;

    @IsEnum(['us', 'international'])
    account_type: string;

    @IsString()
    currency: string;

    @IsObject()
    @ValidateNested()
    @Type(() => ExternalAccountDetailDto)
    account: ExternalAccountDetailDto;

    // Flattened fields required by Bridge API
    @IsNumber()
    account_number: number;

    @IsNumber()
    routing_number: number;

    @IsOptional()
    @IsObject()
    swift?: { category: string; purpose_of_funds: string[] };
}

// --- TRANSFERS (ACH/Withdraw) ---

export class CreateTransferDto {
    @IsObject()
    source: {
        currency: string;
        payment_rail: string;
        from_id?: string; // Optional if using address
    };

    @IsObject()
    destination: {
        currency: string;
        payment_rail: string;
        to_id?: string; // e.g., the external_account_id
    };

    @IsOptional()
    @IsString()
    amount: string | null;

    @IsString()
    on_behalf_of: string;

    @IsOptional()
    @IsString()
    client_reference_id?: string;
}

export class ExternalAccountResponse extends BaseBridgeResponse {
    // ... TODO: specific fields
}

export class VirtualAccountDestinationDto {
    @IsString()
    @IsNotEmpty()
    payment_rail: string; // e.g., "ethereum", "stellar"

    @IsString()
    @IsNotEmpty()
    currency: string; // e.g., "usdc"

    @IsString()
    @IsNotEmpty()
    address: string;

    /**
     * Optional memo for blockchains like Stellar or Hedera
     */
    @IsOptional()
    @IsString()
    blockchain_memo?: string;
}

export class CreateVirtualAccountDto {
    @IsObject()
    source: {
        currency: string; // "usd", "eur", "mxn", "brl", "gbp"
    };

    @IsObject()
    @ValidateNested()
    @Type(() => VirtualAccountDestinationDto)
    destination: VirtualAccountDestinationDto;

    /**
     * Optional developer fee (e.g., "1.0" for 1%) to monetize the transaction
     */
    @IsOptional()
    @IsNumberString()
    developer_fee_percent?: string;
}

export class SourceDepositInstructionsDto {
    @IsString()
    currency: string;

    @IsString()
    payment_rail: string;

    @IsArray()
    payment_rails: string[];

    // USD Fields
    @IsOptional() @IsString() bank_name?: string;
    @IsOptional() @IsString() bank_routing_number?: string;
    @IsOptional() @IsString() bank_account_number?: string;
    @IsOptional() @IsString() bank_beneficiary_name?: string;

    // SEPA (EUR) Fields
    @IsOptional() @IsString() iban?: string;
    @IsOptional() @IsString() bic?: string;

    // MXN Fields
    @IsOptional() @IsString() clabe?: string;

    // BRL Fields
    @IsOptional() @IsString() br_code?: string;

    // GBP Fields
    @IsOptional() @IsString() sort_code?: string;

    @IsOptional() @IsString() account_holder_name?: string;
}
