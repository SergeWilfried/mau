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
exports.TransfersController = void 0;
const common_1 = require("@nestjs/common");
const transfers_service_1 = require("./transfers.service");
const auth_guard_1 = require("../common/guards/auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let TransfersController = class TransfersController {
    constructor(transfersService) {
        this.transfersService = transfersService;
    }
    internalTransfer(user, body) {
        return this.transfersService.internalTransfer(user.id, body.fromAccountId, body.toAccountId, body.amount);
    }
    p2pTransfer(user, body) {
        return this.transfersService.p2pTransfer(user.id, body.fromAccountId, body.recipient, body.recipientType, body.amount, body.currency, body.note);
    }
    cryptoTransfer(user, body) {
        return this.transfersService.cryptoTransfer(user.id, body);
    }
    mobileMoneyTransfer(user, body) {
        return this.transfersService.mobileMoneyTransfer(user.id, body.fromAccountId, body);
    }
    getMobileMoneyProviders(country) {
        return this.transfersService.getMobileMoneyProviders(country);
    }
    bankTransfer(user, body) {
        return this.transfersService.bankTransfer(user.id, body.fromAccountId, body);
    }
    requestMoney(user, body) {
        return this.transfersService.requestMoney(user.id, body.recipient, body.recipientType, body.amount, body.currency, body.note);
    }
    getPaymentRequests(user) {
        return this.transfersService.getPaymentRequests(user.id);
    }
    acceptRequest(user, requestId, body) {
        return this.transfersService.acceptPaymentRequest(user.id, requestId, body.fromAccountId);
    }
    declineRequest(user, requestId) {
        return this.transfersService.declinePaymentRequest(user.id, requestId);
    }
    scheduleTransfer(user, body) {
        return this.transfersService.scheduleTransfer(user.id, body);
    }
    getScheduledTransfers(user) {
        return this.transfersService.getScheduledTransfers(user.id);
    }
    cancelScheduledTransfer(user, id) {
        return this.transfersService.cancelScheduledTransfer(user.id, id);
    }
};
exports.TransfersController = TransfersController;
__decorate([
    (0, common_1.Post)('internal'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TransfersController.prototype, "internalTransfer", null);
__decorate([
    (0, common_1.Post)('p2p'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TransfersController.prototype, "p2pTransfer", null);
__decorate([
    (0, common_1.Post)('crypto'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TransfersController.prototype, "cryptoTransfer", null);
__decorate([
    (0, common_1.Post)('mobile-money'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TransfersController.prototype, "mobileMoneyTransfer", null);
__decorate([
    (0, common_1.Get)('mobile-money/providers'),
    __param(0, (0, common_1.Query)('country')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TransfersController.prototype, "getMobileMoneyProviders", null);
__decorate([
    (0, common_1.Post)('bank'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TransfersController.prototype, "bankTransfer", null);
__decorate([
    (0, common_1.Post)('request'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TransfersController.prototype, "requestMoney", null);
__decorate([
    (0, common_1.Get)('requests'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TransfersController.prototype, "getPaymentRequests", null);
__decorate([
    (0, common_1.Post)('requests/:requestId/accept'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('requestId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], TransfersController.prototype, "acceptRequest", null);
__decorate([
    (0, common_1.Post)('requests/:requestId/decline'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('requestId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TransfersController.prototype, "declineRequest", null);
__decorate([
    (0, common_1.Post)('schedule'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TransfersController.prototype, "scheduleTransfer", null);
__decorate([
    (0, common_1.Get)('scheduled'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TransfersController.prototype, "getScheduledTransfers", null);
__decorate([
    (0, common_1.Post)('scheduled/:id/cancel'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TransfersController.prototype, "cancelScheduledTransfer", null);
exports.TransfersController = TransfersController = __decorate([
    (0, common_1.Controller)('transfers'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [transfers_service_1.TransfersService])
], TransfersController);
//# sourceMappingURL=transfers.controller.js.map