import { Controller, Post, Body, HttpCode, HttpStatus, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /auth/register - Register new user
  @Post('register')
  register(@Body() body: { email: string; password: string; phone?: string }) {
    return this.authService.register(body.email, body.password, body.phone);
  }

  // POST /auth/login - User login with email/password
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  // POST /auth/login-phone - Request OTP for phone login
  @Post('login-phone')
  loginWithPhone(@Body() body: { phone: string }) {
    return this.authService.loginWithPhone(body.phone);
  }

  // POST /auth/verify-otp - Verify phone OTP and login
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  verifyOtp(@Body() body: { phone: string; otp: string }) {
    return this.authService.verifyPhoneOtp(body.phone, body.otp);
  }

  // POST /auth/logout - User logout
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Headers('authorization') authHeader: string) {
    const token = authHeader?.split(' ')[1];
    return this.authService.logout(token);
  }

  // POST /auth/refresh - Refresh access token
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refreshToken(body.refreshToken);
  }

  // POST /auth/forgot-password - Request password reset
  @Post('forgot-password')
  forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  // POST /auth/reset-password - Reset password with token
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(
    @Headers('authorization') authHeader: string,
    @Body() body: { newPassword: string },
  ) {
    const token = authHeader?.split(' ')[1];
    return this.authService.resetPassword(token, body.newPassword);
  }
}
