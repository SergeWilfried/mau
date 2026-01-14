import { Controller, Get, Put, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users/me - Get current user profile
  @Get('me')
  getProfile(@CurrentUser() user: any) {
    return this.usersService.getProfile(user.id);
  }

  // PUT /users/me - Update current user profile
  @Put('me')
  updateProfile(
    @CurrentUser() user: any,
    @Body() body: { firstName?: string; lastName?: string; dateOfBirth?: string; address?: object },
  ) {
    return this.usersService.updateProfile(user.id, {
      first_name: body.firstName,
      last_name: body.lastName,
      date_of_birth: body.dateOfBirth,
      address: body.address,
    });
  }

  // DELETE /users/me - Delete/close account
  @Delete('me')
  deleteAccount(@CurrentUser() user: any) {
    return this.usersService.deleteAccount(user.id);
  }

  // GET /users/me/kyc - Get KYC status
  @Get('me/kyc')
  getKycStatus(@CurrentUser() user: any) {
    return this.usersService.getKycStatus(user.id);
  }

  // POST /users/me/kyc/documents - Upload KYC document
  @Post('me/kyc/documents')
  uploadKycDocument(
    @CurrentUser() user: any,
    @Body() body: { type: string; filePath: string },
  ) {
    return this.usersService.uploadKycDocument(user.id, body.type, body.filePath);
  }

  // GET /users/me/settings - Get user settings
  @Get('me/settings')
  getSettings(@CurrentUser() user: any) {
    return this.usersService.getSettings(user.id);
  }

  // PUT /users/me/settings - Update user settings
  @Put('me/settings')
  updateSettings(
    @CurrentUser() user: any,
    @Body() body: { language?: string; currency?: string },
  ) {
    return this.usersService.updateSettings(user.id, {
      language: body.language,
      preferred_currency: body.currency,
    });
  }

  // POST /users/me/settings/2fa/enable - Enable 2FA
  @Post('me/settings/2fa/enable')
  enable2FA(@CurrentUser() user: any) {
    return this.usersService.enable2FA(user.id);
  }

  // POST /users/me/settings/2fa/confirm - Confirm 2FA setup
  @Post('me/settings/2fa/confirm')
  confirm2FA(@CurrentUser() user: any, @Body() body: { otp: string }) {
    return this.usersService.confirm2FA(user.id, body.otp);
  }

  // POST /users/me/settings/2fa/disable - Disable 2FA
  @Post('me/settings/2fa/disable')
  disable2FA(@CurrentUser() user: any, @Body() body: { otp: string }) {
    return this.usersService.disable2FA(user.id, body.otp);
  }

  // PUT /users/me/pin - Set/update PIN
  @Put('me/pin')
  updatePin(@CurrentUser() user: any, @Body() body: { newPin: string }) {
    return this.usersService.updatePin(user.id, body.newPin);
  }

  // GET /users/me/devices - List authorized devices
  @Get('me/devices')
  getDevices(@CurrentUser() user: any) {
    return this.usersService.getDevices(user.id);
  }

  // POST /users/me/devices - Register a device
  @Post('me/devices')
  registerDevice(
    @CurrentUser() user: any,
    @Body() body: { deviceName: string; deviceType: string; pushToken?: string; platform: 'ios' | 'android' | 'web' },
  ) {
    return this.usersService.registerDevice(user.id, {
      device_name: body.deviceName,
      device_type: body.deviceType,
      push_token: body.pushToken,
      platform: body.platform,
    });
  }

  // DELETE /users/me/devices/:deviceId - Revoke device access
  @Delete('me/devices/:deviceId')
  revokeDevice(@CurrentUser() user: any, @Param('deviceId') deviceId: string) {
    return this.usersService.revokeDevice(user.id, deviceId);
  }
}
