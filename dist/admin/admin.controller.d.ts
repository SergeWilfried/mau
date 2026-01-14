import { AdminService } from './admin.service';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getDashboard(): Promise<{
        totalUsers: number;
        pendingKyc: number;
        pendingTransfers: number;
        todayTransactionVolume: number;
        todayTransactionCount: number;
    }>;
    getUsers(role?: string, kycStatus?: string, search?: string, limit?: number, offset?: number): Promise<{
        users: any[];
        total: number;
        limit: number;
        offset: number;
    }>;
    getUser(userId: string): Promise<any>;
    updateUserRole(admin: any, userId: string, body: {
        role: 'user' | 'admin';
    }): Promise<{
        message: string;
    }>;
    suspendUser(admin: any, userId: string, body: {
        reason: string;
    }): Promise<{
        message: string;
    }>;
    unsuspendUser(admin: any, userId: string): Promise<{
        message: string;
    }>;
    getPendingKyc(limit?: number, offset?: number): Promise<{
        documents: any[];
        total: number;
        limit: number;
        offset: number;
    }>;
    approveKyc(admin: any, documentId: string): Promise<{
        message: string;
    }>;
    rejectKyc(admin: any, documentId: string, body: {
        reason: string;
    }): Promise<{
        message: string;
    }>;
    getTransactions(userId?: string, type?: string, status?: string, from?: string, to?: string, minAmount?: number, maxAmount?: number, limit?: number, offset?: number): Promise<{
        transactions: any[];
        total: number;
        limit: number;
        offset: number;
    }>;
    getPendingTransfers(limit?: number, offset?: number): Promise<{
        transfers: any[];
        total: number;
        limit: number;
        offset: number;
    }>;
    approveTransfer(admin: any, transferId: string): Promise<{
        message: string;
    }>;
    rejectTransfer(admin: any, transferId: string, body: {
        reason: string;
    }): Promise<{
        message: string;
    }>;
    sendNotification(admin: any, body: {
        userId: string;
        type: string;
        title: string;
        message: string;
    }): Promise<{
        message: string;
        notificationId: any;
    }>;
    broadcastNotification(admin: any, body: {
        type: string;
        title: string;
        message: string;
        targetRole?: 'user' | 'admin' | 'all';
    }): Promise<{
        message: string;
        count: number;
    }>;
    getAuditLogs(adminId?: string, action?: string, targetType?: string, from?: string, to?: string, limit?: number, offset?: number): Promise<{
        logs: any[];
        total: number;
        limit: number;
        offset: number;
    }>;
}
