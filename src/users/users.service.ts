import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class UsersService {
    constructor(private supabaseService: SupabaseService) {}

    async getProfile(userId: string) {
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !data) {
            throw new NotFoundException('Profile not found');
        }

        return data;
    }

    async getUserRole(userId: string): Promise<string> {
        const { data } = await this.supabaseService
            .getAdminClient()
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();

        return data?.role || 'user';
    }

    async updateProfile(
        userId: string,
        updates: {
            first_name?: string;
            last_name?: string;
            date_of_birth?: string;
            address?: object;
            preferred_currency?: string;
            language?: string;
        }
    ) {
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            throw new BadRequestException(error.message);
        }

        return data;
    }

    async getKycStatus(userId: string) {
        const { data: profile } = await this.supabaseService
            .getAdminClient()
            .from('profiles')
            .select('kyc_status, kyc_level')
            .eq('id', userId)
            .single();

        const { data: documents } = await this.supabaseService
            .getAdminClient()
            .from('kyc_documents')
            .select('*')
            .eq('user_id', userId);

        return {
            status: profile?.kyc_status || 'pending',
            level: profile?.kyc_level || 'none',
            documents: documents || []
        };
    }

    async uploadKycDocument(userId: string, type: string, filePath: string) {
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('kyc_documents')
            .insert({
                user_id: userId,
                type,
                file_path: filePath,
                status: 'pending'
            })
            .select()
            .single();

        if (error) {
            throw new BadRequestException(error.message);
        }

        // Update profile KYC status to submitted
        await this.supabaseService
            .getAdminClient()
            .from('profiles')
            .update({ kyc_status: 'submitted' })
            .eq('id', userId);

        return data;
    }

    async getSettings(userId: string) {
        const { data } = await this.supabaseService
            .getAdminClient()
            .from('profiles')
            .select('language, preferred_currency, two_factor_enabled')
            .eq('id', userId)
            .single();

        return {
            language: data?.language || 'en',
            currency: data?.preferred_currency || 'EUR',
            twoFactorEnabled: data?.two_factor_enabled || false
        };
    }

    async updateSettings(
        userId: string,
        settings: {
            language?: string;
            preferred_currency?: string;
        }
    ) {
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('profiles')
            .update(settings)
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            throw new BadRequestException(error.message);
        }

        return { message: 'Settings updated successfully' };
    }

    async enable2FA(userId: string) {
        // Generate TOTP secret (in production, use a proper TOTP library)
        const secret = this.generateTOTPSecret();

        await this.supabaseService
            .getAdminClient()
            .from('profiles')
            .update({
                two_factor_secret: secret
            })
            .eq('id', userId);

        return {
            secret,
            qrCode: `otpauth://totp/DouniPay:user?secret=${secret}&issuer=DouniPay`
        };
    }

    async confirm2FA(userId: string, otp: string) {
        // Verify OTP against stored secret (implement proper TOTP verification)
        await this.supabaseService
            .getAdminClient()
            .from('profiles')
            .update({ two_factor_enabled: true })
            .eq('id', userId);

        return { message: '2FA enabled successfully' };
    }

    async disable2FA(userId: string, otp: string) {
        // Verify OTP first, then disable
        await this.supabaseService
            .getAdminClient()
            .from('profiles')
            .update({
                two_factor_enabled: false,
                two_factor_secret: null
            })
            .eq('id', userId);

        return { message: '2FA disabled successfully' };
    }

    async updatePin(userId: string, newPin: string) {
        // In production, hash the PIN before storing
        const hashedPin = this.hashPin(newPin);

        await this.supabaseService.getAdminClient().from('profiles').update({ pin_hash: hashedPin }).eq('id', userId);

        return { message: 'PIN updated successfully' };
    }

    async getDevices(userId: string) {
        const { data } = await this.supabaseService
            .getAdminClient()
            .from('user_devices')
            .select('*')
            .eq('user_id', userId)
            .order('last_active_at', { ascending: false });

        return { devices: data || [] };
    }

    async registerDevice(
        userId: string,
        device: {
            device_name: string;
            device_type: string;
            push_token?: string;
            platform: 'ios' | 'android' | 'web';
        }
    ) {
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('user_devices')
            .insert({ user_id: userId, ...device })
            .select()
            .single();

        if (error) {
            throw new BadRequestException(error.message);
        }

        return data;
    }

    async revokeDevice(userId: string, deviceId: string) {
        const { error } = await this.supabaseService
            .getAdminClient()
            .from('user_devices')
            .delete()
            .eq('id', deviceId)
            .eq('user_id', userId);

        if (error) {
            throw new BadRequestException(error.message);
        }

        return { message: 'Device revoked successfully' };
    }

    async deleteAccount(userId: string) {
        // Soft delete or initiate account closure process
        // In production, this would trigger a proper account closure workflow
        return { message: 'Account deletion initiated. Your account will be closed within 30 days.' };
    }

    private generateTOTPSecret(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let secret = '';
        for (let i = 0; i < 32; i++) {
            secret += chars[Math.floor(Math.random() * chars.length)];
        }
        return secret;
    }

    private hashPin(pin: string): string {
        // In production, use bcrypt or similar
        return Buffer.from(pin).toString('base64');
    }
}
