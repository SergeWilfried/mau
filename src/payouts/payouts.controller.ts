import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { PayoutsService } from './payouts.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('payouts')
@UseGuards(AuthGuard)
export class PayoutsController {
    constructor(private readonly payoutsService: PayoutsService) {}

    // ==================== BANK ACCOUNT PAYOUT ====================

    // POST /payouts/bank - Initiate bank account payout
    @Post('bank')
    initiateBankPayout(
        @CurrentUser() user: any,
        @Body()
        body: {
            fromAccountId: string;
            beneficiaryId?: string;
            bankName?: string;
            accountName?: string;
            accountNumber?: string;
            iban?: string;
            bic?: string;
            routingNumber?: string;
            country: string;
            amount: number;
            currency: string;
            reference?: string;
        }
    ) {
        return this.payoutsService.initiateBankPayout(user.id, body.fromAccountId, {
            beneficiaryId: body.beneficiaryId,
            bankName: body.bankName,
            accountName: body.accountName,
            accountNumber: body.accountNumber,
            iban: body.iban,
            bic: body.bic,
            routingNumber: body.routingNumber,
            country: body.country,
            amount: body.amount,
            currency: body.currency,
            reference: body.reference
        });
    }

    // ==================== MOBILE MONEY PAYOUT ====================

    // POST /payouts/mobile-money - Initiate mobile money payout
    @Post('mobile-money')
    initiateMobileMoneyPayout(
        @CurrentUser() user: any,
        @Body()
        body: {
            fromAccountId: string;
            beneficiaryId?: string;
            provider: string;
            phone: string;
            recipientName: string;
            amount: number;
            currency: string;
            note?: string;
        }
    ) {
        return this.payoutsService.initiateMobileMoneyPayout(user.id, body.fromAccountId, {
            beneficiaryId: body.beneficiaryId,
            provider: body.provider,
            phone: body.phone,
            recipientName: body.recipientName,
            amount: body.amount,
            currency: body.currency,
            note: body.note
        });
    }

    // ==================== GENERAL ====================

    // GET /payouts - List payout requests
    @Get()
    getPayouts(
        @CurrentUser() user: any,
        @Query('status') status?: string,
        @Query('method') method?: string,
        @Query('limit') limit?: number,
        @Query('offset') offset?: number
    ) {
        return this.payoutsService.getPayouts(user.id, status, method, limit, offset);
    }

    // GET /payouts/quote - Get payout quote
    @Get('quote')
    getPayoutQuote(
        @Query('method') method: 'bank_account' | 'mobile_money',
        @Query('amount') amount: number,
        @Query('currency') currency: string,
        @Query('country') country?: string,
        @Query('provider') provider?: string
    ) {
        return this.payoutsService.getPayoutQuote(method, {
            country,
            provider,
            amount: Number(amount),
            currency
        });
    }

    // GET /payouts/methods - Get available payout methods
    @Get('methods')
    getPayoutMethods(@Query('country') country?: string) {
        return this.payoutsService.getPayoutMethods(country);
    }

    // GET /payouts/:payoutId - Get payout details
    @Get(':payoutId')
    getPayout(@CurrentUser() user: any, @Param('payoutId') payoutId: string) {
        return this.payoutsService.getPayout(user.id, payoutId);
    }

    // POST /payouts/:payoutId/cancel - Cancel payout
    @Post(':payoutId/cancel')
    cancelPayout(@CurrentUser() user: any, @Param('payoutId') payoutId: string) {
        return this.payoutsService.cancelPayout(user.id, payoutId);
    }
}
