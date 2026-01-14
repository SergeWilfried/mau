import { SupabaseService } from '../supabase/supabase.service';
export declare class AuthService {
    private supabaseService;
    constructor(supabaseService: SupabaseService);
    register(email: string, password: string, phone?: string): Promise<{
        user: import("@supabase/auth-js").User;
        message: string;
    }>;
    login(email: string, password: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        user: import("@supabase/auth-js").User;
    }>;
    loginWithPhone(phone: string): Promise<{
        message: string;
    }>;
    verifyPhoneOtp(phone: string, otp: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        user: import("@supabase/auth-js").User;
    }>;
    logout(accessToken: string): Promise<{
        message: string;
    }>;
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }>;
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    resetPassword(accessToken: string, newPassword: string): Promise<{
        message: string;
    }>;
}
