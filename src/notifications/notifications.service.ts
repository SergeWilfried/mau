import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class NotificationsService {
    constructor(private supabaseService: SupabaseService) {}

    async getNotifications(userId: string, read?: boolean, limit: number = 20, offset: number = 0) {
        let query = this.supabaseService
            .getAdminClient()
            .from('notifications')
            .select('*', { count: 'exact' })
            .eq('user_id', userId);

        if (read !== undefined) query = query.eq('read', read);

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw new BadRequestException(error.message);

        // Get unread count
        const { count: unreadCount } = await this.supabaseService
            .getAdminClient()
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('read', false);

        return {
            notifications: data,
            unreadCount: unreadCount || 0,
            total: count
        };
    }

    async getNotification(userId: string, notificationId: string) {
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('notifications')
            .select('*')
            .eq('id', notificationId)
            .eq('user_id', userId)
            .single();

        if (error || !data) throw new NotFoundException('Notification not found');
        return data;
    }

    async markAsRead(userId: string, notificationId: string) {
        const { error } = await this.supabaseService
            .getAdminClient()
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId)
            .eq('user_id', userId);

        if (error) throw new BadRequestException(error.message);
        return { message: 'Notification marked as read' };
    }

    async markAllAsRead(userId: string) {
        const { error } = await this.supabaseService
            .getAdminClient()
            .from('notifications')
            .update({ read: true })
            .eq('user_id', userId)
            .eq('read', false);

        if (error) throw new BadRequestException(error.message);
        return { message: 'All notifications marked as read' };
    }

    async deleteNotification(userId: string, notificationId: string) {
        const { error } = await this.supabaseService
            .getAdminClient()
            .from('notifications')
            .delete()
            .eq('id', notificationId)
            .eq('user_id', userId);

        if (error) throw new BadRequestException(error.message);
        return { message: 'Notification deleted' };
    }

    async deleteAllNotifications(userId: string) {
        const { error } = await this.supabaseService
            .getAdminClient()
            .from('notifications')
            .delete()
            .eq('user_id', userId);

        if (error) throw new BadRequestException(error.message);
        return { message: 'All notifications deleted' };
    }

    async getPreferences(userId: string) {
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
                sms: { security: true, largeTransactions: true }
            };
        }

        return {
            push: {
                transactions: data.push_transactions,
                marketing: data.push_marketing,
                security: data.push_security,
                priceAlerts: data.push_price_alerts
            },
            email: {
                transactions: data.email_transactions,
                marketing: data.email_marketing,
                security: data.email_security,
                monthlyStatement: data.email_monthly_statement
            },
            sms: {
                security: data.sms_security,
                largeTransactions: data.sms_large_transactions
            }
        };
    }

    async updatePreferences(
        userId: string,
        preferences: {
            push?: { transactions?: boolean; marketing?: boolean; security?: boolean; priceAlerts?: boolean };
            email?: { transactions?: boolean; marketing?: boolean; security?: boolean; monthlyStatement?: boolean };
            sms?: { security?: boolean; largeTransactions?: boolean };
        }
    ) {
        const updates: any = {};

        if (preferences.push) {
            if (preferences.push.transactions !== undefined) updates.push_transactions = preferences.push.transactions;
            if (preferences.push.marketing !== undefined) updates.push_marketing = preferences.push.marketing;
            if (preferences.push.security !== undefined) updates.push_security = preferences.push.security;
            if (preferences.push.priceAlerts !== undefined) updates.push_price_alerts = preferences.push.priceAlerts;
        }

        if (preferences.email) {
            if (preferences.email.transactions !== undefined)
                updates.email_transactions = preferences.email.transactions;
            if (preferences.email.marketing !== undefined) updates.email_marketing = preferences.email.marketing;
            if (preferences.email.security !== undefined) updates.email_security = preferences.email.security;
            if (preferences.email.monthlyStatement !== undefined)
                updates.email_monthly_statement = preferences.email.monthlyStatement;
        }

        if (preferences.sms) {
            if (preferences.sms.security !== undefined) updates.sms_security = preferences.sms.security;
            if (preferences.sms.largeTransactions !== undefined)
                updates.sms_large_transactions = preferences.sms.largeTransactions;
        }

        const { error } = await this.supabaseService
            .getAdminClient()
            .from('notification_preferences')
            .update(updates)
            .eq('user_id', userId);

        if (error) throw new BadRequestException(error.message);
        return { message: 'Preferences updated successfully' };
    }

    async createNotification(
        userId: string,
        notification: {
            type: string;
            title: string;
            message: string;
            data?: object;
        }
    ) {
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('notifications')
            .insert({ user_id: userId, ...notification })
            .select()
            .single();

        if (error) throw new BadRequestException(error.message);
        return data;
    }

    async createPriceAlert(
        userId: string,
        alert: {
            symbol: string;
            targetPrice: number;
            condition: 'above' | 'below';
            assetType?: 'crypto' | 'fiat';
            targetCurrency?: string;
        }
    ) {
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('price_alerts')
            .insert({
                user_id: userId,
                asset_type: alert.assetType || 'crypto',
                symbol: alert.symbol,
                target_currency: alert.targetCurrency || 'EUR',
                target_price: alert.targetPrice,
                condition: alert.condition
            })
            .select()
            .single();

        if (error) throw new BadRequestException(error.message);
        return { alertId: data.id, message: 'Price alert created' };
    }

    async getPriceAlerts(userId: string) {
        const { data } = await this.supabaseService
            .getAdminClient()
            .from('price_alerts')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'active');

        return { alerts: data || [] };
    }

    async deletePriceAlert(userId: string, alertId: string) {
        await this.supabaseService
            .getAdminClient()
            .from('price_alerts')
            .update({ status: 'cancelled' })
            .eq('id', alertId)
            .eq('user_id', userId);

        return { message: 'Price alert deleted' };
    }
}
