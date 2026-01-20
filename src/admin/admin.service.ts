import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AdminService {
    constructor(private supabaseService: SupabaseService) {}

    // ==================== USER MANAGEMENT ====================

    async getUsers(filters: { role?: string; kycStatus?: string; search?: string; limit?: number; offset?: number }) {
        let query = this.supabaseService.getAdminClient().from('profiles').select('*', { count: 'exact' });

        if (filters.role) query = query.eq('role', filters.role);
        if (filters.kycStatus) query = query.eq('kyc_status', filters.kycStatus);
        if (filters.search) {
            query = query.or(
                `email.ilike.%${filters.search}%,first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`
            );
        }

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 20) - 1);

        if (error) throw new BadRequestException(error.message);

        return { users: data, total: count, limit: filters.limit || 20, offset: filters.offset || 0 };
    }

    async getUser(userId: string) {
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !data) throw new NotFoundException('User not found');
        return data;
    }

    async updateUserRole(adminId: string, userId: string, role: 'user' | 'admin') {
        const { error } = await this.supabaseService
            .getAdminClient()
            .from('profiles')
            .update({ role })
            .eq('id', userId);

        if (error) throw new BadRequestException(error.message);

        await this.createAuditLog(adminId, 'update_role', 'user', userId, { newRole: role });

        return { message: `User role updated to ${role}` };
    }

    async suspendUser(adminId: string, userId: string, reason: string) {
        // Freeze all user accounts
        await this.supabaseService.getAdminClient().from('accounts').update({ status: 'frozen' }).eq('user_id', userId);

        await this.createAuditLog(adminId, 'suspend_user', 'user', userId, { reason });

        return { message: 'User suspended successfully' };
    }

    async unsuspendUser(adminId: string, userId: string) {
        // Unfreeze all user accounts
        await this.supabaseService.getAdminClient().from('accounts').update({ status: 'active' }).eq('user_id', userId);

        await this.createAuditLog(adminId, 'unsuspend_user', 'user', userId, {});

        return { message: 'User unsuspended successfully' };
    }

    // ==================== KYC MANAGEMENT ====================

    async getPendingKyc(limit: number = 20, offset: number = 0) {
        const { data, error, count } = await this.supabaseService
            .getAdminClient()
            .from('kyc_documents')
            .select(
                `
        *,
        profiles:user_id (id, email, first_name, last_name)
      `,
                { count: 'exact' }
            )
            .eq('status', 'pending')
            .order('submitted_at', { ascending: true })
            .range(offset, offset + limit - 1);

        if (error) throw new BadRequestException(error.message);

        return { documents: data, total: count, limit, offset };
    }

    async approveKyc(adminId: string, documentId: string) {
        const { data: doc, error: fetchError } = await this.supabaseService
            .getAdminClient()
            .from('kyc_documents')
            .select('user_id, type')
            .eq('id', documentId)
            .single();

        if (fetchError || !doc) throw new NotFoundException('Document not found');

        const { error } = await this.supabaseService
            .getAdminClient()
            .from('kyc_documents')
            .update({
                status: 'approved',
                reviewed_at: new Date().toISOString()
            })
            .eq('id', documentId);

        if (error) throw new BadRequestException(error.message);

        // Update user's KYC status
        await this.updateUserKycStatus(doc.user_id);

        await this.createAuditLog(adminId, 'approve_kyc', 'kyc', documentId, { userId: doc.user_id });

        return { message: 'KYC document approved' };
    }

    async rejectKyc(adminId: string, documentId: string, reason: string) {
        const { data: doc, error: fetchError } = await this.supabaseService
            .getAdminClient()
            .from('kyc_documents')
            .select('user_id')
            .eq('id', documentId)
            .single();

        if (fetchError || !doc) throw new NotFoundException('Document not found');

        const { error } = await this.supabaseService
            .getAdminClient()
            .from('kyc_documents')
            .update({
                status: 'rejected',
                rejection_reason: reason,
                reviewed_at: new Date().toISOString()
            })
            .eq('id', documentId);

        if (error) throw new BadRequestException(error.message);

        // Update profile KYC status
        await this.supabaseService
            .getAdminClient()
            .from('profiles')
            .update({ kyc_status: 'rejected' })
            .eq('id', doc.user_id);

        await this.createAuditLog(adminId, 'reject_kyc', 'kyc', documentId, { userId: doc.user_id, reason });

        return { message: 'KYC document rejected' };
    }

    private async updateUserKycStatus(userId: string) {
        // Check all approved documents and determine KYC level
        const { data: docs } = await this.supabaseService
            .getAdminClient()
            .from('kyc_documents')
            .select('type')
            .eq('user_id', userId)
            .eq('status', 'approved');

        const approvedTypes = docs?.map((d) => d.type) || [];

        let kycLevel = 'none';
        let kycStatus = 'pending';

        if (
            approvedTypes.includes('selfie') &&
            (approvedTypes.includes('passport') || approvedTypes.includes('id_card'))
        ) {
            kycLevel = 'basic';
            kycStatus = 'verified';
        }
        if (kycLevel === 'basic' && approvedTypes.includes('proof_of_address')) {
            kycLevel = 'intermediate';
        }
        if (approvedTypes.length >= 4) {
            kycLevel = 'full';
        }

        await this.supabaseService
            .getAdminClient()
            .from('profiles')
            .update({ kyc_level: kycLevel, kyc_status: kycStatus })
            .eq('id', userId);
    }

    // ==================== TRANSACTION MANAGEMENT ====================

    async getAllTransactions(filters: {
        userId?: string;
        type?: string;
        status?: string;
        from?: string;
        to?: string;
        minAmount?: number;
        maxAmount?: number;
        limit?: number;
        offset?: number;
    }) {
        let query = this.supabaseService
            .getAdminClient()
            .from('transactions')
            .select(
                `
        *,
        profiles:user_id (email, first_name, last_name)
      `,
                { count: 'exact' }
            );

        if (filters.userId) query = query.eq('user_id', filters.userId);
        if (filters.type) query = query.eq('type', filters.type);
        if (filters.status) query = query.eq('status', filters.status);
        if (filters.from) query = query.gte('created_at', filters.from);
        if (filters.to) query = query.lte('created_at', filters.to);
        if (filters.minAmount) query = query.gte('amount', filters.minAmount);
        if (filters.maxAmount) query = query.lte('amount', filters.maxAmount);

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 20) - 1);

        if (error) throw new BadRequestException(error.message);

        return { transactions: data, total: count, limit: filters.limit || 20, offset: filters.offset || 0 };
    }

    async getPendingTransfers(limit: number = 20, offset: number = 0) {
        const { data, error, count } = await this.supabaseService
            .getAdminClient()
            .from('transfers')
            .select(
                `
        *,
        sender:sender_id (email, first_name, last_name)
      `,
                { count: 'exact' }
            )
            .eq('status', 'pending')
            .order('created_at', { ascending: true })
            .range(offset, offset + limit - 1);

        if (error) throw new BadRequestException(error.message);

        return { transfers: data, total: count, limit, offset };
    }

    async approveTransfer(adminId: string, transferId: string) {
        const { error } = await this.supabaseService
            .getAdminClient()
            .from('transfers')
            .update({
                status: 'processing',
                executed_at: new Date().toISOString()
            })
            .eq('id', transferId);

        if (error) throw new BadRequestException(error.message);

        await this.createAuditLog(adminId, 'approve_transfer', 'transfer', transferId, {});

        return { message: 'Transfer approved and processing' };
    }

    async rejectTransfer(adminId: string, transferId: string, reason: string) {
        // Get transfer details to refund
        const { data: transfer } = await this.supabaseService
            .getAdminClient()
            .from('transfers')
            .select('sender_account_id, amount, fee')
            .eq('id', transferId)
            .single();

        if (transfer?.sender_account_id) {
            // Refund the amount + fee
            const refundAmount = Number(transfer.amount) + Number(transfer.fee || 0);
            const { data: account } = await this.supabaseService
                .getAdminClient()
                .from('accounts')
                .select('balance')
                .eq('id', transfer.sender_account_id)
                .single();

            await this.supabaseService
                .getAdminClient()
                .from('accounts')
                .update({ balance: Number(account?.balance || 0) + refundAmount })
                .eq('id', transfer.sender_account_id);
        }

        const { error } = await this.supabaseService
            .getAdminClient()
            .from('transfers')
            .update({ status: 'failed' })
            .eq('id', transferId);

        if (error) throw new BadRequestException(error.message);

        await this.createAuditLog(adminId, 'reject_transfer', 'transfer', transferId, { reason });

        return { message: 'Transfer rejected and refunded' };
    }

    // ==================== CRYPTO TRANSACTIONS ====================

    async getAllCryptoTransactions(filters: {
        userId?: string;
        symbol?: string;
        type?: string;
        from?: string;
        to?: string;
        limit?: number;
        offset?: number;
    }) {
        let query = this.supabaseService
            .getAdminClient()
            .from('crypto_transactions')
            .select(
                `
        *,
        profiles:user_id (email, first_name, last_name)
      `,
                { count: 'exact' }
            );

        if (filters.userId) query = query.eq('user_id', filters.userId);
        if (filters.symbol) query = query.eq('symbol', filters.symbol.toUpperCase());
        if (filters.type) query = query.eq('type', filters.type);
        if (filters.from) query = query.gte('created_at', filters.from);
        if (filters.to) query = query.lte('created_at', filters.to);

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 20) - 1);

        if (error) throw new BadRequestException(error.message);

        return { transactions: data, total: count, limit: filters.limit || 20, offset: filters.offset || 0 };
    }

    // ==================== DASHBOARD & ANALYTICS ====================

    async getDashboardStats() {
        const client = this.supabaseService.getAdminClient();

        // Get user counts
        const { count: totalUsers } = await client.from('profiles').select('*', { count: 'exact', head: true });

        const { count: pendingKyc } = await client
            .from('kyc_documents')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

        const { count: pendingTransfers } = await client
            .from('transfers')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

        // Get today's transaction volume
        const today = new Date().toISOString().split('T')[0];
        const { data: todayTx } = await client
            .from('transactions')
            .select('amount, currency')
            .gte('created_at', today)
            .eq('status', 'completed');

        const todayVolume = todayTx?.reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0) || 0;

        return {
            totalUsers,
            pendingKyc,
            pendingTransfers,
            todayTransactionVolume: todayVolume,
            todayTransactionCount: todayTx?.length || 0
        };
    }

    // ==================== AUDIT LOGS ====================

    async getAuditLogs(filters: {
        adminId?: string;
        action?: string;
        targetType?: string;
        from?: string;
        to?: string;
        limit?: number;
        offset?: number;
    }) {
        let query = this.supabaseService
            .getAdminClient()
            .from('admin_audit_logs')
            .select(
                `
        *,
        admin:admin_id (email, first_name, last_name)
      `,
                { count: 'exact' }
            );

        if (filters.adminId) query = query.eq('admin_id', filters.adminId);
        if (filters.action) query = query.eq('action', filters.action);
        if (filters.targetType) query = query.eq('target_type', filters.targetType);
        if (filters.from) query = query.gte('created_at', filters.from);
        if (filters.to) query = query.lte('created_at', filters.to);

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 20) - 1);

        if (error) throw new BadRequestException(error.message);

        return { logs: data, total: count, limit: filters.limit || 20, offset: filters.offset || 0 };
    }

    private async createAuditLog(
        adminId: string,
        action: string,
        targetType: string,
        targetId: string,
        details: object
    ) {
        await this.supabaseService.getAdminClient().from('admin_audit_logs').insert({
            admin_id: adminId,
            action,
            target_type: targetType,
            target_id: targetId,
            details
        });
    }

    // ==================== NOTIFICATIONS ====================

    async sendNotificationToUser(
        adminId: string,
        userId: string,
        notification: {
            type: string;
            title: string;
            message: string;
        }
    ) {
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('notifications')
            .insert({
                user_id: userId,
                type: notification.type,
                title: notification.title,
                message: notification.message
            })
            .select()
            .single();

        if (error) throw new BadRequestException(error.message);

        await this.createAuditLog(adminId, 'send_notification', 'notification', data.id, { userId });

        return { message: 'Notification sent', notificationId: data.id };
    }

    async sendBroadcastNotification(
        adminId: string,
        notification: {
            type: string;
            title: string;
            message: string;
            targetRole?: 'user' | 'admin' | 'all';
        }
    ) {
        let query = this.supabaseService.getAdminClient().from('profiles').select('id');

        if (notification.targetRole && notification.targetRole !== 'all') {
            query = query.eq('role', notification.targetRole);
        }

        const { data: users } = await query;

        if (!users || users.length === 0) {
            return { message: 'No users to notify', count: 0 };
        }

        const notifications = users.map((user) => ({
            user_id: user.id,
            type: notification.type,
            title: notification.title,
            message: notification.message
        }));

        const { error } = await this.supabaseService.getAdminClient().from('notifications').insert(notifications);

        if (error) throw new BadRequestException(error.message);

        await this.createAuditLog(adminId, 'broadcast_notification', 'notification', null, {
            count: users.length,
            targetRole: notification.targetRole
        });

        return { message: 'Broadcast sent', count: users.length };
    }
}
