export declare class BeneficiariesController {
    getBeneficiaries(type?: 'bank' | 'p2p' | 'mobilemoney', search?: string): {
        beneficiaries: {
            id: string;
            type: string;
            name: string;
            iban: string;
            bic: string;
            currency: string;
            isFavorite: boolean;
        }[];
    };
    addBeneficiary(body: {
        type: 'bank' | 'p2p';
        name: string;
        iban?: string;
        bic?: string;
        phone?: string;
        email?: string;
        currency?: string;
    }): {
        message: string;
        type: "bank" | "p2p";
        name: string;
        iban?: string;
        bic?: string;
        phone?: string;
        email?: string;
        currency?: string;
        id: string;
    };
    getBeneficiary(id: string): {
        id: string;
        type: string;
        name: string;
        iban: string;
        bic: string;
        currency: string;
        bankName: string;
        bankAddress: string;
        isFavorite: boolean;
        createdAt: string;
    };
    updateBeneficiary(id: string, body: {
        name?: string;
        isFavorite?: boolean;
    }): {
        message: string;
    };
    deleteBeneficiary(id: string): {
        message: string;
    };
    markFavorite(id: string): {
        message: string;
    };
    removeFavorite(id: string): {
        message: string;
    };
    validateIban(body: {
        iban: string;
    }): {
        valid: boolean;
        bankName: string;
        bic: string;
        country: string;
    };
    getRecentBeneficiaries(limit?: number): {
        beneficiaries: any[];
    };
}
