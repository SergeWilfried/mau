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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let AuthService = class AuthService {
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async register(email, password, phone) {
        const { data, error } = await this.supabaseService.getClient().auth.signUp({
            email,
            password,
            phone,
        });
        if (error) {
            throw new common_1.BadRequestException(error.message);
        }
        return {
            user: data.user,
            message: 'Registration successful. Please check your email to verify your account.',
        };
    }
    async login(email, password) {
        const { data, error } = await this.supabaseService
            .getClient()
            .auth.signInWithPassword({ email, password });
        if (error) {
            throw new common_1.UnauthorizedException(error.message);
        }
        return {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
            expiresIn: data.session.expires_in,
            user: data.user,
        };
    }
    async loginWithPhone(phone) {
        const { data, error } = await this.supabaseService
            .getClient()
            .auth.signInWithOtp({ phone });
        if (error) {
            throw new common_1.BadRequestException(error.message);
        }
        return { message: 'OTP sent to your phone' };
    }
    async verifyPhoneOtp(phone, otp) {
        const { data, error } = await this.supabaseService.getClient().auth.verifyOtp({
            phone,
            token: otp,
            type: 'sms',
        });
        if (error) {
            throw new common_1.UnauthorizedException(error.message);
        }
        return {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
            expiresIn: data.session.expires_in,
            user: data.user,
        };
    }
    async logout(accessToken) {
        const client = this.supabaseService.getClientWithAuth(accessToken);
        const { error } = await client.auth.signOut();
        if (error) {
            throw new common_1.BadRequestException(error.message);
        }
        return { message: 'Logged out successfully' };
    }
    async refreshToken(refreshToken) {
        const { data, error } = await this.supabaseService
            .getClient()
            .auth.refreshSession({ refresh_token: refreshToken });
        if (error) {
            throw new common_1.UnauthorizedException(error.message);
        }
        return {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
            expiresIn: data.session.expires_in,
        };
    }
    async forgotPassword(email) {
        const { error } = await this.supabaseService
            .getClient()
            .auth.resetPasswordForEmail(email);
        if (error) {
            throw new common_1.BadRequestException(error.message);
        }
        return { message: 'Password reset email sent' };
    }
    async resetPassword(accessToken, newPassword) {
        const client = this.supabaseService.getClientWithAuth(accessToken);
        const { error } = await client.auth.updateUser({ password: newPassword });
        if (error) {
            throw new common_1.BadRequestException(error.message);
        }
        return { message: 'Password updated successfully' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], AuthService);
//# sourceMappingURL=auth.service.js.map