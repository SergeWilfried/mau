import { SupabaseService } from '../supabase/supabase.service';
export declare class NotificationsService {
    private supabaseService;
    constructor(supabaseService: SupabaseService);
    getNotifications(userId: string, read?: boolean, limit?: number, offset?: number): Promise<{
        notifications: any[];
        unreadCount: number;
        total: number;
    }>;
    getNotification(userId: string, notificationId: string): Promise<any>;
    markAsRead(userId: string, notificationId: string): Promise<{
        message: string;
    }>;
    markAllAsRead(userId: string): Promise<{
        message: string;
    }>;
    deleteNotification(userId: string, notificationId: string): Promise<{
        message: string;
    }>;
    deleteAllNotifications(userId: string): Promise<{
        message: string;
    }>;
    getPreferences(userId: string): Promise<{
        push: {
            transactions: any;
            marketing: any;
            security: any;
            priceAlerts: any;
        };
        email: {
            transactions: any;
            marketing: any;
            security: any;
            monthlyStatement: any;
        };
        sms: {
            security: any;
            largeTransactions: any;
        };
    }>;
    updatePreferences(userId: string, preferences: {
        push?: {
            transactions?: boolean;
            marketing?: boolean;
            security?: boolean;
            priceAlerts?: boolean;
        };
        email?: {
            transactions?: boolean;
            marketing?: boolean;
            security?: boolean;
            monthlyStatement?: boolean;
        };
        sms?: {
            security?: boolean;
            largeTransactions?: boolean;
        };
    }): Promise<{
        message: string;
    }>;
    createNotification(userId: string, notification: {
        type: string;
        title: string;
        message: string;
        data?: object;
    }): Promise<any>;
    createPriceAlert(userId: string, alert: {
        symbol: string;
        targetPrice: number;
        condition: 'above' | 'below';
        assetType?: 'crypto' | 'fiat';
        targetCurrency?: string;
    }): Promise<{
        alertId: any;
        message: string;
    }>;
    getPriceAlerts(userId: string): Promise<{
        alerts: any[];
    }>;
    deletePriceAlert(userId: string, alertId: string): Promise<{
        message: string;
    }>;
}
