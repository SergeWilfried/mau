import { SupabaseService } from '../supabase/supabase.service';
export declare class AdminService {
    private supabaseService;
    constructor(supabaseService: SupabaseService);
    getUsers(filters: {
        role?: string;
        kycStatus?: string;
        search?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        users: any[];
        total: number;
        limit: number;
        offset: number;
    }>;
    getUser(userId: string): Promise<any>;
    updateUserRole(adminId: string, userId: string, role: 'user' | 'admin'): Promise<{
        message: string;
    }>;
    suspendUser(adminId: string, userId: string, reason: string): Promise<{
        message: string;
    }>;
    unsuspendUser(adminId: string, userId: string): Promise<{
        message: string;
    }>;
    getPendingKyc(limit?: number, offset?: number): Promise<{
        documents: any[];
        total: number;
        limit: number;
        offset: number;
    }>;
    approveKyc(adminId: string, documentId: string): Promise<{
        message: string;
    }>;
    rejectKyc(adminId: string, documentId: string, reason: string): Promise<{
        message: string;
    }>;
    private updateUserKycStatus;
    getAllTransactions(filters: {
        userId?: string;
        type?: string;
        status?: string;
        from?: string;
        to?: string;
        minAmount?: number;
        maxAmount?: number;
        limit?: number;
        offset?: number;
    }): Promise<{
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
    approveTransfer(adminId: string, transferId: string): Promise<{
        message: string;
    }>;
    rejectTransfer(adminId: string, transferId: string, reason: string): Promise<{
        message: string;
    }>;
    getDashboardStats(): Promise<{
        totalUsers: number;
        pendingKyc: number;
        pendingTransfers: number;
        todayTransactionVolume: number;
        todayTransactionCount: number;
    }>;
    getAuditLogs(filters: {
        adminId?: string;
        action?: string;
        targetType?: string;
        from?: string;
        to?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        logs: any[];
        total: number;
        limit: number;
        offset: number;
    }>;
    private createAuditLog;
    sendNotificationToUser(adminId: string, userId: string, notification: {
        type: string;
        title: string;
        message: string;
    }): Promise<{
        message: string;
        notificationId: any;
    }>;
    sendBroadcastNotification(adminId: string, notification: {
        type: string;
        title: string;
        message: string;
        targetRole?: 'user' | 'admin' | 'all';
    }): Promise<{
        message: string;
        count: number;
    }>;
}
