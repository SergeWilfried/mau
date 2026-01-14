import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(body: {
        email: string;
        password: string;
        phone?: string;
    }): Promise<{
        user: import("@supabase/auth-js").User;
        message: string;
    }>;
    login(body: {
        email: string;
        password: string;
    }): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        user: import("@supabase/auth-js").User;
    }>;
    loginWithPhone(body: {
        phone: string;
    }): Promise<{
        message: string;
    }>;
    verifyOtp(body: {
        phone: string;
        otp: string;
    }): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        user: import("@supabase/auth-js").User;
    }>;
    logout(authHeader: string): Promise<{
        message: string;
    }>;
    refresh(body: {
        refreshToken: string;
    }): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }>;
    forgotPassword(body: {
        email: string;
    }): Promise<{
        message: string;
    }>;
    resetPassword(authHeader: string, body: {
        newPassword: string;
    }): Promise<{
        message: string;
    }>;
}
