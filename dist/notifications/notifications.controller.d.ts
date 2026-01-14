export declare class NotificationsController {
    getNotifications(read?: boolean, limit?: number, offset?: number): {
        notifications: {
            id: string;
            type: string;
            title: string;
            message: string;
            read: boolean;
            createdAt: string;
        }[];
        unreadCount: number;
        total: number;
    };
    getNotification(id: string): {
        id: string;
        type: string;
        title: string;
        message: string;
        read: boolean;
        createdAt: string;
        data: {
            transactionId: string;
        };
    };
    markAsRead(id: string): {
        message: string;
    };
    markAllAsRead(): {
        message: string;
    };
    deleteNotification(id: string): {
        message: string;
    };
    deleteAllNotifications(): {
        message: string;
    };
    getPreferences(): {
        push: {
            transactions: boolean;
            marketing: boolean;
            security: boolean;
            priceAlerts: boolean;
        };
        email: {
            transactions: boolean;
            marketing: boolean;
            security: boolean;
            monthlyStatement: boolean;
        };
        sms: {
            security: boolean;
            largeTransactions: boolean;
        };
    };
    updatePreferences(body: {
        push?: object;
        email?: object;
        sms?: object;
    }): {
        message: string;
    };
    registerDeviceToken(body: {
        token: string;
        platform: 'ios' | 'android';
    }): {
        message: string;
    };
    unregisterDeviceToken(body: {
        token: string;
    }): {
        message: string;
    };
    createPriceAlert(body: {
        fromCurrency: string;
        toCurrency: string;
        targetRate: number;
        condition: 'above' | 'below';
    }): {
        alertId: string;
        message: string;
    };
    getPriceAlerts(): {
        alerts: any[];
    };
    deletePriceAlert(id: string): {
        message: string;
    };
}
