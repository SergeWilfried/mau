import { SupabaseService } from '../supabase/supabase.service';
export declare class UsersService {
    private supabaseService;
    constructor(supabaseService: SupabaseService);
    getProfile(userId: string): Promise<any>;
    getUserRole(userId: string): Promise<string>;
    updateProfile(userId: string, updates: {
        first_name?: string;
        last_name?: string;
        date_of_birth?: string;
        address?: object;
        preferred_currency?: string;
        language?: string;
    }): Promise<any>;
    getKycStatus(userId: string): Promise<{
        status: any;
        level: any;
        documents: any[];
    }>;
    uploadKycDocument(userId: string, type: string, filePath: string): Promise<any>;
    getSettings(userId: string): Promise<{
        language: any;
        currency: any;
        twoFactorEnabled: any;
    }>;
    updateSettings(userId: string, settings: {
        language?: string;
        preferred_currency?: string;
    }): Promise<{
        message: string;
    }>;
    enable2FA(userId: string): Promise<{
        secret: string;
        qrCode: string;
    }>;
    confirm2FA(userId: string, otp: string): Promise<{
        message: string;
    }>;
    disable2FA(userId: string, otp: string): Promise<{
        message: string;
    }>;
    updatePin(userId: string, newPin: string): Promise<{
        message: string;
    }>;
    getDevices(userId: string): Promise<{
        devices: any[];
    }>;
    registerDevice(userId: string, device: {
        device_name: string;
        device_type: string;
        push_token?: string;
        platform: 'ios' | 'android' | 'web';
    }): Promise<any>;
    revokeDevice(userId: string, deviceId: string): Promise<{
        message: string;
    }>;
    deleteAccount(userId: string): Promise<{
        message: string;
    }>;
    private generateTOTPSecret;
    private hashPin;
}
