import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(user: any): Promise<any>;
    updateProfile(user: any, body: {
        firstName?: string;
        lastName?: string;
        dateOfBirth?: string;
        address?: object;
    }): Promise<any>;
    deleteAccount(user: any): Promise<{
        message: string;
    }>;
    getKycStatus(user: any): Promise<{
        status: any;
        level: any;
        documents: any[];
    }>;
    uploadKycDocument(user: any, body: {
        type: string;
        filePath: string;
    }): Promise<any>;
    getSettings(user: any): Promise<{
        language: any;
        currency: any;
        twoFactorEnabled: any;
    }>;
    updateSettings(user: any, body: {
        language?: string;
        currency?: string;
    }): Promise<{
        message: string;
    }>;
    enable2FA(user: any): Promise<{
        secret: string;
        qrCode: string;
    }>;
    confirm2FA(user: any, body: {
        otp: string;
    }): Promise<{
        message: string;
    }>;
    disable2FA(user: any, body: {
        otp: string;
    }): Promise<{
        message: string;
    }>;
    updatePin(user: any, body: {
        newPin: string;
    }): Promise<{
        message: string;
    }>;
    getDevices(user: any): Promise<{
        devices: any[];
    }>;
    registerDevice(user: any, body: {
        deviceName: string;
        deviceType: string;
        pushToken?: string;
        platform: 'ios' | 'android' | 'web';
    }): Promise<any>;
    revokeDevice(user: any, deviceId: string): Promise<{
        message: string;
    }>;
}
