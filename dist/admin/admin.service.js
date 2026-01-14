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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let AdminService = class AdminService {
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async getUsers(filters) {
        let query = this.supabaseService
            .getAdminClient()
            .from('profiles')
            .select('*', { count: 'exact' });
        if (filters.role)
            query = query.eq('role', filters.role);
        if (filters.kycStatus)
            query = query.eq('kyc_status', filters.kycStatus);
        if (filters.search) {
            query = query.or(`email.ilike.%${filters.search}%,first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`);
        }
        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 20) - 1);
        if (error)
            throw new common_1.BadRequestException(error.message);
        return { users: data, total: count, limit: filters.limit || 20, offset: filters.offset || 0 };
    }
    async getUser(userId) {
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (error || !data)
            throw new common_1.NotFoundException('User not found');
        return data;
    }
    async updateUserRole(adminId, userId, role) {
        const { error } = await this.supabaseService
            .getAdminClient()
            .from('profiles')
            .update({ role })
            .eq('id', userId);
        if (error)
            throw new common_1.BadRequestException(error.message);
        await this.createAuditLog(adminId, 'update_role', 'user', userId, { newRole: role });
        return { message: `User role updated to ${role}` };
    }
    async suspendUser(adminId, userId, reason) {
        await this.supabaseService
            .getAdminClient()
            .from('accounts')
            .update({ status: 'frozen' })
            .eq('user_id', userId);
        await this.createAuditLog(adminId, 'suspend_user', 'user', userId, { reason });
        return { message: 'User suspended successfully' };
    }
    async unsuspendUser(adminId, userId) {
        await this.supabaseService
            .getAdminClient()
            .from('accounts')
            .update({ status: 'active' })
            .eq('user_id', userId);
        await this.createAuditLog(adminId, 'unsuspend_user', 'user', userId, {});
        return { message: 'User unsuspended successfully' };
    }
    async getPendingKyc(limit = 20, offset = 0) {
        const { data, error, count } = await this.supabaseService
            .getAdminClient()
            .from('kyc_documents')
            .select(`
        *,
        profiles:user_id (id, email, first_name, last_name)
      `, { count: 'exact' })
            .eq('status', 'pending')
            .order('submitted_at', { ascending: true })
            .range(offset, offset + limit - 1);
        if (error)
            throw new common_1.BadRequestException(error.message);
        return { documents: data, total: count, limit, offset };
    }
    async approveKyc(adminId, documentId) {
        const { data: doc, error: fetchError } = await this.supabaseService
            .getAdminClient()
            .from('kyc_documents')
            .select('user_id, type')
            .eq('id', documentId)
            .single();
        if (fetchError || !doc)
            throw new common_1.NotFoundException('Document not found');
        const { error } = await this.supabaseService
            .getAdminClient()
            .from('kyc_documents')
            .update({
            status: 'approved',
            reviewed_at: new Date().toISOString(),
        })
            .eq('id', documentId);
        if (error)
            throw new common_1.BadRequestException(error.message);
        await this.updateUserKycStatus(doc.user_id);
        await this.createAuditLog(adminId, 'approve_kyc', 'kyc', documentId, { userId: doc.user_id });
        return { message: 'KYC document approved' };
    }
    async rejectKyc(adminId, documentId, reason) {
        const { data: doc, error: fetchError } = await this.supabaseService
            .getAdminClient()
            .from('kyc_documents')
            .select('user_id')
            .eq('id', documentId)
            .single();
        if (fetchError || !doc)
            throw new common_1.NotFoundException('Document not found');
        const { error } = await this.supabaseService
            .getAdminClient()
            .from('kyc_documents')
            .update({
            status: 'rejected',
            rejection_reason: reason,
            reviewed_at: new Date().toISOString(),
        })
            .eq('id', documentId);
        if (error)
            throw new common_1.BadRequestException(error.message);
        await this.supabaseService
            .getAdminClient()
            .from('profiles')
            .update({ kyc_status: 'rejected' })
            .eq('id', doc.user_id);
        await this.createAuditLog(adminId, 'reject_kyc', 'kyc', documentId, { userId: doc.user_id, reason });
        return { message: 'KYC document rejected' };
    }
    async updateUserKycStatus(userId) {
        const { data: docs } = await this.supabaseService
            .getAdminClient()
            .from('kyc_documents')
            .select('type')
            .eq('user_id', userId)
            .eq('status', 'approved');
        const approvedTypes = docs?.map((d) => d.type) || [];
        let kycLevel = 'none';
        let kycStatus = 'pending';
        if (approvedTypes.includes('selfie') && (approvedTypes.includes('passport') || approvedTypes.includes('id_card'))) {
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
    async getAllTransactions(filters) {
        let query = this.supabaseService
            .getAdminClient()
            .from('transactions')
            .select(`
        *,
        profiles:user_id (email, first_name, last_name)
      `, { count: 'exact' });
        if (filters.userId)
            query = query.eq('user_id', filters.userId);
        if (filters.type)
            query = query.eq('type', filters.type);
        if (filters.status)
            query = query.eq('status', filters.status);
        if (filters.from)
            query = query.gte('created_at', filters.from);
        if (filters.to)
            query = query.lte('created_at', filters.to);
        if (filters.minAmount)
            query = query.gte('amount', filters.minAmount);
        if (filters.maxAmount)
            query = query.lte('amount', filters.maxAmount);
        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 20) - 1);
        if (error)
            throw new common_1.BadRequestException(error.message);
        return { transactions: data, total: count, limit: filters.limit || 20, offset: filters.offset || 0 };
    }
    async getPendingTransfers(limit = 20, offset = 0) {
        const { data, error, count } = await this.supabaseService
            .getAdminClient()
            .from('transfers')
            .select(`
        *,
        sender:sender_id (email, first_name, last_name)
      `, { count: 'exact' })
            .eq('status', 'pending')
            .order('created_at', { ascending: true })
            .range(offset, offset + limit - 1);
        if (error)
            throw new common_1.BadRequestException(error.message);
        return { transfers: data, total: count, limit, offset };
    }
    async approveTransfer(adminId, transferId) {
        const { error } = await this.supabaseService
            .getAdminClient()
            .from('transfers')
            .update({
            status: 'processing',
            executed_at: new Date().toISOString(),
        })
            .eq('id', transferId);
        if (error)
            throw new common_1.BadRequestException(error.message);
        await this.createAuditLog(adminId, 'approve_transfer', 'transfer', transferId, {});
        return { message: 'Transfer approved and processing' };
    }
    async rejectTransfer(adminId, transferId, reason) {
        const { data: transfer } = await this.supabaseService
            .getAdminClient()
            .from('transfers')
            .select('sender_account_id, amount, fee')
            .eq('id', transferId)
            .single();
        if (transfer?.sender_account_id) {
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
        if (error)
            throw new common_1.BadRequestException(error.message);
        await this.createAuditLog(adminId, 'reject_transfer', 'transfer', transferId, { reason });
        return { message: 'Transfer rejected and refunded' };
    }
    async getDashboardStats() {
        const client = this.supabaseService.getAdminClient();
        const { count: totalUsers } = await client
            .from('profiles')
            .select('*', { count: 'exact', head: true });
        const { count: pendingKyc } = await client
            .from('kyc_documents')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');
        const { count: pendingTransfers } = await client
            .from('transfers')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');
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
            todayTransactionCount: todayTx?.length || 0,
        };
    }
    async getAuditLogs(filters) {
        let query = this.supabaseService
            .getAdminClient()
            .from('admin_audit_logs')
            .select(`
        *,
        admin:admin_id (email, first_name, last_name)
      `, { count: 'exact' });
        if (filters.adminId)
            query = query.eq('admin_id', filters.adminId);
        if (filters.action)
            query = query.eq('action', filters.action);
        if (filters.targetType)
            query = query.eq('target_type', filters.targetType);
        if (filters.from)
            query = query.gte('created_at', filters.from);
        if (filters.to)
            query = query.lte('created_at', filters.to);
        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 20) - 1);
        if (error)
            throw new common_1.BadRequestException(error.message);
        return { logs: data, total: count, limit: filters.limit || 20, offset: filters.offset || 0 };
    }
    async createAuditLog(adminId, action, targetType, targetId, details) {
        await this.supabaseService
            .getAdminClient()
            .from('admin_audit_logs')
            .insert({
            admin_id: adminId,
            action,
            target_type: targetType,
            target_id: targetId,
            details,
        });
    }
    async sendNotificationToUser(adminId, userId, notification) {
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('notifications')
            .insert({
            user_id: userId,
            type: notification.type,
            title: notification.title,
            message: notification.message,
        })
            .select()
            .single();
        if (error)
            throw new common_1.BadRequestException(error.message);
        await this.createAuditLog(adminId, 'send_notification', 'notification', data.id, { userId });
        return { message: 'Notification sent', notificationId: data.id };
    }
    async sendBroadcastNotification(adminId, notification) {
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
            message: notification.message,
        }));
        const { error } = await this.supabaseService
            .getAdminClient()
            .from('notifications')
            .insert(notifications);
        if (error)
            throw new common_1.BadRequestException(error.message);
        await this.createAuditLog(adminId, 'broadcast_notification', 'notification', null, {
            count: users.length,
            targetRole: notification.targetRole,
        });
        return { message: 'Broadcast sent', count: users.length };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], AdminService);
//# sourceMappingURL=admin.service.js.map