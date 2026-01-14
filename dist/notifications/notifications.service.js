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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let NotificationsService = class NotificationsService {
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async getNotifications(userId, read, limit = 20, offset = 0) {
        let query = this.supabaseService
            .getAdminClient()
            .from('notifications')
            .select('*', { count: 'exact' })
            .eq('user_id', userId);
        if (read !== undefined)
            query = query.eq('read', read);
        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        if (error)
            throw new common_1.BadRequestException(error.message);
        const { count: unreadCount } = await this.supabaseService
            .getAdminClient()
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('read', false);
        return {
            notifications: data,
            unreadCount: unreadCount || 0,
            total: count,
        };
    }
    async getNotification(userId, notificationId) {
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('notifications')
            .select('*')
            .eq('id', notificationId)
            .eq('user_id', userId)
            .single();
        if (error || !data)
            throw new common_1.NotFoundException('Notification not found');
        return data;
    }
    async markAsRead(userId, notificationId) {
        const { error } = await this.supabaseService
            .getAdminClient()
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId)
            .eq('user_id', userId);
        if (error)
            throw new common_1.BadRequestException(error.message);
        return { message: 'Notification marked as read' };
    }
    async markAllAsRead(userId) {
        const { error } = await this.supabaseService
            .getAdminClient()
            .from('notifications')
            .update({ read: true })
            .eq('user_id', userId)
            .eq('read', false);
        if (error)
            throw new common_1.BadRequestException(error.message);
        return { message: 'All notifications marked as read' };
    }
    async deleteNotification(userId, notificationId) {
        const { error } = await this.supabaseService
            .getAdminClient()
            .from('notifications')
            .delete()
            .eq('id', notificationId)
            .eq('user_id', userId);
        if (error)
            throw new common_1.BadRequestException(error.message);
        return { message: 'Notification deleted' };
    }
    async deleteAllNotifications(userId) {
        const { error } = await this.supabaseService
            .getAdminClient()
            .from('notifications')
            .delete()
            .eq('user_id', userId);
        if (error)
            throw new common_1.BadRequestException(error.message);
        return { message: 'All notifications deleted' };
    }
    async getPreferences(userId) {
        const { data } = await this.supabaseService
            .getAdminClient()
            .from('notification_preferences')
            .select('*')
            .eq('user_id', userId)
            .single();
        if (!data) {
            return {
                push: { transactions: true, marketing: false, security: true, priceAlerts: true },
                email: { transactions: true, marketing: false, security: true, monthlyStatement: true },
                sms: { security: true, largeTransactions: true },
            };
        }
        return {
            push: {
                transactions: data.push_transactions,
                marketing: data.push_marketing,
                security: data.push_security,
                priceAlerts: data.push_price_alerts,
            },
            email: {
                transactions: data.email_transactions,
                marketing: data.email_marketing,
                security: data.email_security,
                monthlyStatement: data.email_monthly_statement,
            },
            sms: {
                security: data.sms_security,
                largeTransactions: data.sms_large_transactions,
            },
        };
    }
    async updatePreferences(userId, preferences) {
        const updates = {};
        if (preferences.push) {
            if (preferences.push.transactions !== undefined)
                updates.push_transactions = preferences.push.transactions;
            if (preferences.push.marketing !== undefined)
                updates.push_marketing = preferences.push.marketing;
            if (preferences.push.security !== undefined)
                updates.push_security = preferences.push.security;
            if (preferences.push.priceAlerts !== undefined)
                updates.push_price_alerts = preferences.push.priceAlerts;
        }
        if (preferences.email) {
            if (preferences.email.transactions !== undefined)
                updates.email_transactions = preferences.email.transactions;
            if (preferences.email.marketing !== undefined)
                updates.email_marketing = preferences.email.marketing;
            if (preferences.email.security !== undefined)
                updates.email_security = preferences.email.security;
            if (preferences.email.monthlyStatement !== undefined)
                updates.email_monthly_statement = preferences.email.monthlyStatement;
        }
        if (preferences.sms) {
            if (preferences.sms.security !== undefined)
                updates.sms_security = preferences.sms.security;
            if (preferences.sms.largeTransactions !== undefined)
                updates.sms_large_transactions = preferences.sms.largeTransactions;
        }
        const { error } = await this.supabaseService
            .getAdminClient()
            .from('notification_preferences')
            .update(updates)
            .eq('user_id', userId);
        if (error)
            throw new common_1.BadRequestException(error.message);
        return { message: 'Preferences updated successfully' };
    }
    async createNotification(userId, notification) {
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('notifications')
            .insert({ user_id: userId, ...notification })
            .select()
            .single();
        if (error)
            throw new common_1.BadRequestException(error.message);
        return data;
    }
    async createPriceAlert(userId, alert) {
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('price_alerts')
            .insert({
            user_id: userId,
            asset_type: alert.assetType || 'crypto',
            symbol: alert.symbol,
            target_currency: alert.targetCurrency || 'EUR',
            target_price: alert.targetPrice,
            condition: alert.condition,
        })
            .select()
            .single();
        if (error)
            throw new common_1.BadRequestException(error.message);
        return { alertId: data.id, message: 'Price alert created' };
    }
    async getPriceAlerts(userId) {
        const { data } = await this.supabaseService
            .getAdminClient()
            .from('price_alerts')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'active');
        return { alerts: data || [] };
    }
    async deletePriceAlert(userId, alertId) {
        await this.supabaseService
            .getAdminClient()
            .from('price_alerts')
            .update({ status: 'cancelled' })
            .eq('id', alertId)
            .eq('user_id', userId);
        return { message: 'Price alert deleted' };
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map