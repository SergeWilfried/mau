import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';

@Controller('notifications')
export class NotificationsController {
    // GET /notifications - List all notifications
    @Get()
    getNotifications(
        @Query('read') read?: boolean,
        @Query('limit') limit: number = 20,
        @Query('offset') offset: number = 0
    ) {
        return {
            notifications: [
                {
                    id: '1',
                    type: 'transaction',
                    title: 'Payment received',
                    message: 'You received €100 from John Doe',
                    read: false,
                    createdAt: '2024-01-15T10:00:00Z'
                }
            ],
            unreadCount: 1,
            total: 1
        };
    }

    // GET /notifications/:id - Get notification details
    @Get(':id')
    getNotification(@Param('id') id: string) {
        return {
            id,
            type: 'transaction',
            title: 'Payment received',
            message: 'You received €100 from John Doe',
            read: false,
            createdAt: '2024-01-15T10:00:00Z',
            data: { transactionId: '123' }
        };
    }

    // PUT /notifications/:id/read - Mark notification as read
    @Put(':id/read')
    markAsRead(@Param('id') id: string) {
        return { message: 'Notification marked as read' };
    }

    // PUT /notifications/read-all - Mark all notifications as read
    @Put('read-all')
    markAllAsRead() {
        return { message: 'All notifications marked as read' };
    }

    // DELETE /notifications/:id - Delete notification
    @Delete(':id')
    deleteNotification(@Param('id') id: string) {
        return { message: 'Notification deleted' };
    }

    // DELETE /notifications - Delete all notifications
    @Delete()
    deleteAllNotifications() {
        return { message: 'All notifications deleted' };
    }

    // GET /notifications/preferences - Get notification preferences
    @Get('settings/preferences')
    getPreferences() {
        return {
            push: {
                transactions: true,
                marketing: false,
                security: true,
                priceAlerts: true
            },
            email: {
                transactions: true,
                marketing: false,
                security: true,
                monthlyStatement: true
            },
            sms: {
                security: true,
                largeTransactions: true
            }
        };
    }

    // PUT /notifications/preferences - Update notification preferences
    @Put('settings/preferences')
    updatePreferences(@Body() body: { push?: object; email?: object; sms?: object }) {
        return { message: 'Preferences updated successfully' };
    }

    // POST /notifications/device-token - Register device for push notifications
    @Post('device-token')
    registerDeviceToken(@Body() body: { token: string; platform: 'ios' | 'android' }) {
        return { message: 'Device registered successfully' };
    }

    // DELETE /notifications/device-token - Unregister device
    @Delete('device-token')
    unregisterDeviceToken(@Body() body: { token: string }) {
        return { message: 'Device unregistered successfully' };
    }

    // POST /notifications/price-alerts - Create price alert
    @Post('price-alerts')
    createPriceAlert(
        @Body() body: { fromCurrency: string; toCurrency: string; targetRate: number; condition: 'above' | 'below' }
    ) {
        return { alertId: '1', message: 'Price alert created' };
    }

    // GET /notifications/price-alerts - List price alerts
    @Get('price-alerts')
    getPriceAlerts() {
        return { alerts: [] };
    }

    // DELETE /notifications/price-alerts/:id - Delete price alert
    @Delete('price-alerts/:id')
    deletePriceAlert(@Param('id') id: string) {
        return { message: 'Price alert deleted' };
    }
}
