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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsController = void 0;
const common_1 = require("@nestjs/common");
let NotificationsController = class NotificationsController {
    getNotifications(read, limit = 20, offset = 0) {
        return {
            notifications: [
                {
                    id: '1',
                    type: 'transaction',
                    title: 'Payment received',
                    message: 'You received €100 from John Doe',
                    read: false,
                    createdAt: '2024-01-15T10:00:00Z',
                },
            ],
            unreadCount: 1,
            total: 1,
        };
    }
    getNotification(id) {
        return {
            id,
            type: 'transaction',
            title: 'Payment received',
            message: 'You received €100 from John Doe',
            read: false,
            createdAt: '2024-01-15T10:00:00Z',
            data: { transactionId: '123' },
        };
    }
    markAsRead(id) {
        return { message: 'Notification marked as read' };
    }
    markAllAsRead() {
        return { message: 'All notifications marked as read' };
    }
    deleteNotification(id) {
        return { message: 'Notification deleted' };
    }
    deleteAllNotifications() {
        return { message: 'All notifications deleted' };
    }
    getPreferences() {
        return {
            push: {
                transactions: true,
                marketing: false,
                security: true,
                priceAlerts: true,
            },
            email: {
                transactions: true,
                marketing: false,
                security: true,
                monthlyStatement: true,
            },
            sms: {
                security: true,
                largeTransactions: true,
            },
        };
    }
    updatePreferences(body) {
        return { message: 'Preferences updated successfully' };
    }
    registerDeviceToken(body) {
        return { message: 'Device registered successfully' };
    }
    unregisterDeviceToken(body) {
        return { message: 'Device unregistered successfully' };
    }
    createPriceAlert(body) {
        return { alertId: '1', message: 'Price alert created' };
    }
    getPriceAlerts() {
        return { alerts: [] };
    }
    deletePriceAlert(id) {
        return { message: 'Price alert deleted' };
    }
};
exports.NotificationsController = NotificationsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('read')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Boolean, Number, Number]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "getNotifications", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "getNotification", null);
__decorate([
    (0, common_1.Put)(':id/read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "markAsRead", null);
__decorate([
    (0, common_1.Put)('read-all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "markAllAsRead", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "deleteNotification", null);
__decorate([
    (0, common_1.Delete)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "deleteAllNotifications", null);
__decorate([
    (0, common_1.Get)('settings/preferences'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "getPreferences", null);
__decorate([
    (0, common_1.Put)('settings/preferences'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "updatePreferences", null);
__decorate([
    (0, common_1.Post)('device-token'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "registerDeviceToken", null);
__decorate([
    (0, common_1.Delete)('device-token'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "unregisterDeviceToken", null);
__decorate([
    (0, common_1.Post)('price-alerts'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "createPriceAlert", null);
__decorate([
    (0, common_1.Get)('price-alerts'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "getPriceAlerts", null);
__decorate([
    (0, common_1.Delete)('price-alerts/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "deletePriceAlert", null);
exports.NotificationsController = NotificationsController = __decorate([
    (0, common_1.Controller)('notifications')
], NotificationsController);
//# sourceMappingURL=notifications.controller.js.map