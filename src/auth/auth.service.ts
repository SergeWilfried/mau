import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(private supabaseService: SupabaseService) {}

    async register(email: string, password: string, phone?: string) {
        this.logger.log(`Registering new user with email ${email}`);
        const { data, error } = await this.supabaseService.getClient().auth.signUp({
            email,
            password,
            phone
        });

        if (error) {
            this.logger.error(`Registration failed for ${email}: ${error.message}`);
            throw new BadRequestException(error.message);
        }

        this.logger.log(`User registered successfully: ${data.user?.id}`);
        return {
            user: data.user,
            message: 'Registration successful. Please check your email to verify your account.'
        };
    }

    async login(email: string, password: string) {
        this.logger.log(`Login attempt for ${email}`);
        const { data, error } = await this.supabaseService.getClient().auth.signInWithPassword({ email, password });

        if (error) {
            this.logger.warn(`Login failed for ${email}: ${error.message}`);
            throw new UnauthorizedException(error.message);
        }

        this.logger.log(`User ${data.user?.id} logged in successfully`);
        return {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
            expiresIn: data.session.expires_in,
            user: data.user
        };
    }

    async loginWithPhone(phone: string) {
        this.logger.log(`Phone login OTP request for ${phone}`);
        const { data, error } = await this.supabaseService.getClient().auth.signInWithOtp({ phone });

        if (error) {
            this.logger.error(`Failed to send OTP to ${phone}: ${error.message}`);
            throw new BadRequestException(error.message);
        }

        this.logger.log(`OTP sent to ${phone}`);
        return { message: 'OTP sent to your phone' };
    }

    async verifyPhoneOtp(phone: string, otp: string) {
        this.logger.log(`Verifying OTP for ${phone}`);
        const { data, error } = await this.supabaseService.getClient().auth.verifyOtp({
            phone,
            token: otp,
            type: 'sms'
        });

        if (error) {
            this.logger.warn(`OTP verification failed for ${phone}: ${error.message}`);
            throw new UnauthorizedException(error.message);
        }

        this.logger.log(`OTP verified successfully for ${phone}, user ${data.user?.id}`);
        return {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
            expiresIn: data.session.expires_in,
            user: data.user
        };
    }

    async logout(accessToken: string) {
        this.logger.log('User logout request');
        const client = this.supabaseService.getClientWithAuth(accessToken);
        const { error } = await client.auth.signOut();

        if (error) {
            this.logger.error(`Logout failed: ${error.message}`);
            throw new BadRequestException(error.message);
        }

        this.logger.log('User logged out successfully');
        return { message: 'Logged out successfully' };
    }

    async refreshToken(refreshToken: string) {
        this.logger.log('Token refresh request');
        const { data, error } = await this.supabaseService
            .getClient()
            .auth.refreshSession({ refresh_token: refreshToken });

        if (error) {
            this.logger.warn(`Token refresh failed: ${error.message}`);
            throw new UnauthorizedException(error.message);
        }

        this.logger.log('Token refreshed successfully');
        return {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
            expiresIn: data.session.expires_in
        };
    }

    async forgotPassword(email: string) {
        this.logger.log(`Password reset requested for ${email}`);
        const { error } = await this.supabaseService.getClient().auth.resetPasswordForEmail(email);

        if (error) {
            this.logger.error(`Password reset request failed for ${email}: ${error.message}`);
            throw new BadRequestException(error.message);
        }

        this.logger.log(`Password reset email sent to ${email}`);
        return { message: 'Password reset email sent' };
    }

    async resetPassword(accessToken: string, newPassword: string) {
        this.logger.log('Password reset in progress');
        const client = this.supabaseService.getClientWithAuth(accessToken);
        const { error } = await client.auth.updateUser({ password: newPassword });

        if (error) {
            this.logger.error(`Password reset failed: ${error.message}`);
            throw new BadRequestException(error.message);
        }

        this.logger.log('Password updated successfully');
        return { message: 'Password updated successfully' };
    }
}
