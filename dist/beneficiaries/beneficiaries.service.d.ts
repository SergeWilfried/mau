import { SupabaseService } from '../supabase/supabase.service';
export declare class BeneficiariesService {
    private supabaseService;
    constructor(supabaseService: SupabaseService);
    getBeneficiaries(userId: string, type?: string, search?: string): Promise<{
        beneficiaries: any[];
    }>;
    addBeneficiary(userId: string, beneficiary: {
        type: 'bank' | 'p2p' | 'mobilemoney' | 'crypto';
        name: string;
        iban?: string;
        bic?: string;
        phone?: string;
        email?: string;
        crypto_address?: string;
        crypto_network?: string;
        currency?: string;
    }): Promise<any>;
    getBeneficiary(userId: string, beneficiaryId: string): Promise<any>;
    updateBeneficiary(userId: string, beneficiaryId: string, updates: {
        name?: string;
        is_favorite?: boolean;
    }): Promise<{
        message: string;
    }>;
    deleteBeneficiary(userId: string, beneficiaryId: string): Promise<{
        message: string;
    }>;
    markFavorite(userId: string, beneficiaryId: string): Promise<{
        message: string;
    }>;
    removeFavorite(userId: string, beneficiaryId: string): Promise<{
        message: string;
    }>;
    getRecentBeneficiaries(userId: string, limit?: number): Promise<{
        beneficiaries: any[];
    }>;
    updateLastUsed(beneficiaryId: string): Promise<void>;
    validateIban(iban: string): {
        valid: boolean;
        error: string;
        bankName?: undefined;
        bic?: undefined;
        country?: undefined;
    } | {
        valid: boolean;
        bankName: string;
        bic: string;
        country: string;
        error?: undefined;
    };
}
