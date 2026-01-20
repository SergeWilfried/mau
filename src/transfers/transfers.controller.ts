import { Controller, Post, Get, Param, Body, Query, UseGuards } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('transfers')
@UseGuards(AuthGuard)
export class TransfersController {
    constructor(private readonly transfersService: TransfersService) {}

    // ==================== INTERNAL TRANSFERS ====================

    // POST /transfers/internal - Transfer between own accounts
    @Post('internal')
    internalTransfer(
        @CurrentUser() user: any,
        @Body() body: { fromAccountId: string; toAccountId: string; amount: number }
    ) {
        return this.transfersService.internalTransfer(user.id, body.fromAccountId, body.toAccountId, body.amount);
    }

    // ==================== P2P TRANSFERS ====================

    // POST /transfers/p2p - Send money to another user (by phone/email/username)
    @Post('p2p')
    p2pTransfer(
        @CurrentUser() user: any,
        @Body()
        body: {
            fromAccountId: string;
            recipient: string;
            recipientType: 'phone' | 'email' | 'username';
            amount: number;
            currency: string;
            note?: string;
        }
    ) {
        return this.transfersService.p2pTransfer(
            user.id,
            body.fromAccountId,
            body.recipient,
            body.recipientType,
            body.amount,
            body.currency,
            body.note
        );
    }

    // ==================== CRYPTO TRANSFERS ====================

    // POST /transfers/crypto - Send crypto to external wallet
    @Post('crypto')
    cryptoTransfer(
        @CurrentUser() user: any,
        @Body()
        body: {
            fromWalletId: string;
            toAddress: string;
            symbol: string;
            network: string;
            amount: number;
            note?: string;
        }
    ) {
        return this.transfersService.cryptoTransfer(user.id, body);
    }

    // ==================== MOBILE MONEY TRANSFERS ====================

    // POST /transfers/mobile-money - Send to mobile money
    @Post('mobile-money')
    mobileMoneyTransfer(
        @CurrentUser() user: any,
        @Body()
        body: {
            fromAccountId: string;
            provider: string;
            phone: string;
            recipientName: string;
            amount: number;
            currency: string;
            note?: string;
        }
    ) {
        return this.transfersService.mobileMoneyTransfer(user.id, body.fromAccountId, body);
    }

    // GET /transfers/mobile-money/providers - Get mobile money providers
    @Get('mobile-money/providers')
    getMobileMoneyProviders(@Query('country') country?: string) {
        return this.transfersService.getMobileMoneyProviders(country);
    }

    // ==================== BANK TRANSFERS ====================

    // POST /transfers/bank - Bank transfer (SEPA/SWIFT)
    @Post('bank')
    bankTransfer(
        @CurrentUser() user: any,
        @Body()
        body: {
            fromAccountId: string;
            beneficiaryId?: string;
            iban?: string;
            bic?: string;
            recipientName?: string;
            amount: number;
            currency: string;
            reference?: string;
            transferType: 'sepa' | 'swift';
        }
    ) {
        return this.transfersService.bankTransfer(user.id, body.fromAccountId, body);
    }

    // ==================== PAYMENT REQUESTS ====================

    // POST /transfers/request - Request money from someone
    @Post('request')
    requestMoney(
        @CurrentUser() user: any,
        @Body()
        body: {
            recipient: string;
            recipientType: 'phone' | 'email' | 'username';
            amount: number;
            currency: string;
            note?: string;
        }
    ) {
        return this.transfersService.requestMoney(
            user.id,
            body.recipient,
            body.recipientType,
            body.amount,
            body.currency,
            body.note
        );
    }

    // GET /transfers/requests - List payment requests (incoming/outgoing)
    @Get('requests')
    getPaymentRequests(@CurrentUser() user: any) {
        return this.transfersService.getPaymentRequests(user.id);
    }

    // POST /transfers/requests/:requestId/accept - Accept payment request
    @Post('requests/:requestId/accept')
    acceptRequest(
        @CurrentUser() user: any,
        @Param('requestId') requestId: string,
        @Body() body: { fromAccountId: string }
    ) {
        return this.transfersService.acceptPaymentRequest(user.id, requestId, body.fromAccountId);
    }

    // POST /transfers/requests/:requestId/decline - Decline payment request
    @Post('requests/:requestId/decline')
    declineRequest(@CurrentUser() user: any, @Param('requestId') requestId: string) {
        return this.transfersService.declinePaymentRequest(user.id, requestId);
    }

    // ==================== SCHEDULED TRANSFERS ====================

    // POST /transfers/schedule - Schedule a future transfer
    @Post('schedule')
    scheduleTransfer(
        @CurrentUser() user: any,
        @Body()
        body: {
            type: 'internal' | 'p2p' | 'bank';
            transferDetails: object;
            scheduledDate: string;
            recurring?: { frequency: 'daily' | 'weekly' | 'monthly'; endDate?: string };
        }
    ) {
        return this.transfersService.scheduleTransfer(user.id, body);
    }

    // GET /transfers/scheduled - List scheduled transfers
    @Get('scheduled')
    getScheduledTransfers(@CurrentUser() user: any) {
        return this.transfersService.getScheduledTransfers(user.id);
    }

    // POST /transfers/scheduled/:id/cancel - Cancel scheduled transfer
    @Post('scheduled/:id/cancel')
    cancelScheduledTransfer(@CurrentUser() user: any, @Param('id') id: string) {
        return this.transfersService.cancelScheduledTransfer(user.id, id);
    }
}
