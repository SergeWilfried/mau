import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AuthService {
  constructor(private supabaseService: SupabaseService) {}

  async register(email: string, password: string, phone?: string) {
    const { data, error } = await this.supabaseService.getClient().auth.signUp({
      email,
      password,
      phone,
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      user: data.user,
      message: 'Registration successful. Please check your email to verify your account.',
    };
  }

  async login(email: string, password: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .auth.signInWithPassword({ email, password });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
      user: data.user,
    };
  }

  async loginWithPhone(phone: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .auth.signInWithOtp({ phone });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { message: 'OTP sent to your phone' };
  }

  async verifyPhoneOtp(phone: string, otp: string) {
    const { data, error } = await this.supabaseService.getClient().auth.verifyOtp({
      phone,
      token: otp,
      type: 'sms',
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
      user: data.user,
    };
  }

  async logout(accessToken: string) {
    const client = this.supabaseService.getClientWithAuth(accessToken);
    const { error } = await client.auth.signOut();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { message: 'Logged out successfully' };
  }

  async refreshToken(refreshToken: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .auth.refreshSession({ refresh_token: refreshToken });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
    };
  }

  async forgotPassword(email: string) {
    const { error } = await this.supabaseService
      .getClient()
      .auth.resetPasswordForEmail(email);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { message: 'Password reset email sent' };
  }

  async resetPassword(accessToken: string, newPassword: string) {
    const client = this.supabaseService.getClientWithAuth(accessToken);
    const { error } = await client.auth.updateUser({ password: newPassword });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { message: 'Password updated successfully' };
  }
}
