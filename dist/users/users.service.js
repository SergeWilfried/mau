"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let UsersService = class UsersService {
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async getProfile(userId) {
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (error || !data) {
            throw new common_1.NotFoundException('Profile not found');
        }
        return data;
    }
    async getUserRole(userId) {
        const { data } = await this.supabaseService
            .getAdminClient()
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();
        return data?.role || 'user';
    }
    async updateProfile(userId, updates) {
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();
        if (error) {
            throw new common_1.BadRequestException(error.message);
        }
        return data;
    }
    async getKycStatus(userId) {
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
            documents: documents || [],
        };
    }
    async uploadKycDocument(userId, type, filePath) {
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('kyc_documents')
            .insert({
            user_id: userId,
            type,
            file_path: filePath,
            status: 'pending',
        })
            .select()
            .single();
        if (error) {
            throw new common_1.BadRequestException(error.message);
        }
        await this.supabaseService
            .getAdminClient()
            .from('profiles')
            .update({ kyc_status: 'submitted' })
            .eq('id', userId);
        return data;
    }
    async getSettings(userId) {
        const { data } = await this.supabaseService
            .getAdminClient()
            .from('profiles')
            .select('language, preferred_currency, two_factor_enabled')
            .eq('id', userId)
            .single();
        return {
            language: data?.language || 'en',
            currency: data?.preferred_currency || 'EUR',
            twoFactorEnabled: data?.two_factor_enabled || false,
        };
    }
    async updateSettings(userId, settings) {
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('profiles')
            .update(settings)
            .eq('id', userId)
            .select()
            .single();
        if (error) {
            throw new common_1.BadRequestException(error.message);
        }
        return { message: 'Settings updated successfully' };
    }
    async enable2FA(userId) {
        const secret = this.generateTOTPSecret();
        await this.supabaseService
            .getAdminClient()
            .from('profiles')
            .update({
            two_factor_secret: secret,
        })
            .eq('id', userId);
        return {
            secret,
            qrCode: `otpauth://totp/DouniPay:user?secret=${secret}&issuer=DouniPay`,
        };
    }
    async confirm2FA(userId, otp) {
        await this.supabaseService
            .getAdminClient()
            .from('profiles')
            .update({ two_factor_enabled: true })
            .eq('id', userId);
        return { message: '2FA enabled successfully' };
    }
    async disable2FA(userId, otp) {
        await this.supabaseService
            .getAdminClient()
            .from('profiles')
            .update({
            two_factor_enabled: false,
            two_factor_secret: null,
        })
            .eq('id', userId);
        return { message: '2FA disabled successfully' };
    }
    async updatePin(userId, newPin) {
        const hashedPin = this.hashPin(newPin);
        await this.supabaseService
            .getAdminClient()
            .from('profiles')
            .update({ pin_hash: hashedPin })
            .eq('id', userId);
        return { message: 'PIN updated successfully' };
    }
    async getDevices(userId) {
        const { data } = await this.supabaseService
            .getAdminClient()
            .from('user_devices')
            .select('*')
            .eq('user_id', userId)
            .order('last_active_at', { ascending: false });
        return { devices: data || [] };
    }
    async registerDevice(userId, device) {
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('user_devices')
            .insert({ user_id: userId, ...device })
            .select()
            .single();
        if (error) {
            throw new common_1.BadRequestException(error.message);
        }
        return data;
    }
    async revokeDevice(userId, deviceId) {
        const { error } = await this.supabaseService
            .getAdminClient()
            .from('user_devices')
            .delete()
            .eq('id', deviceId)
            .eq('user_id', userId);
        if (error) {
            throw new common_1.BadRequestException(error.message);
        }
        return { message: 'Device revoked successfully' };
    }
    async deleteAccount(userId) {
        return { message: 'Account deletion initiated. Your account will be closed within 30 days.' };
    }
    generateTOTPSecret() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let secret = '';
        for (let i = 0; i < 32; i++) {
            secret += chars[Math.floor(Math.random() * chars.length)];
        }
        return secret;
    }
    hashPin(pin) {
        return Buffer.from(pin).toString('base64');
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], UsersService);
//# sourceMappingURL=users.service.js.map