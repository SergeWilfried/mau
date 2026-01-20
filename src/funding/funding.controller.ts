import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { FundingService } from './funding.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('funding')
@UseGuards(AuthGuard)
export class FundingController {
    constructor(private readonly fundingService: FundingService) {}

    // ==================== WIRE TRANSFER ====================

    // POST /funding/wire - Initiate wire transfer funding
    @Post('wire')
    initiateWireFunding(
        @CurrentUser() user: any,
        @Body() body: { accountId: string; amount: number; currency: string }
    ) {
        return this.fundingService.initiateWireFunding(user.id, body.accountId, body.amount, body.currency);
    }

    // ==================== CRYPTO ====================

    // POST /funding/crypto - Initiate crypto funding (get deposit address)
    @Post('crypto')
    initiateCryptoFunding(
        @CurrentUser() user: any,
        @Body()
        body: {
            accountId: string;
            symbol: string;
            network: string;
            expectedAmount?: number;
        }
    ) {
        return this.fundingService.initiateCryptoFunding(
            user.id,
            body.accountId,
            body.symbol,
            body.network,
            body.expectedAmount
        );
    }

    // ==================== MOBILE MONEY ====================

    // POST /funding/mobile-money - Initiate mobile money funding
    @Post('mobile-money')
    initiateMobileMoneyFunding(
        @CurrentUser() user: any,
        @Body()
        body: {
            accountId: string;
            provider: string;
            phone: string;
            amount: number;
            currency: string;
        }
    ) {
        return this.fundingService.initiateMobileMoneyFunding(
            user.id,
            body.accountId,
            body.provider,
            body.phone,
            body.amount,
            body.currency
        );
    }

    // ==================== GENERAL ====================

    // GET /funding - List funding requests
    @Get()
    getFundingRequests(
        @CurrentUser() user: any,
        @Query('status') status?: string,
        @Query('limit') limit?: number,
        @Query('offset') offset?: number
    ) {
        return this.fundingService.getFundingRequests(user.id, status, limit, offset);
    }

    // GET /funding/:fundingId - Get funding request details
    @Get(':fundingId')
    getFundingRequest(@CurrentUser() user: any, @Param('fundingId') fundingId: string) {
        return this.fundingService.getFundingRequest(user.id, fundingId);
    }

    // POST /funding/:fundingId/cancel - Cancel funding request
    @Post(':fundingId/cancel')
    cancelFundingRequest(@CurrentUser() user: any, @Param('fundingId') fundingId: string) {
        return this.fundingService.cancelFundingRequest(user.id, fundingId);
    }

    // GET /funding/methods/available - Get available funding methods
    @Get('methods/available')
    getAvailableMethods(@Query('country') country?: string) {
        return {
            methods: [
                {
                    id: 'wire',
                    name: 'Wire Transfer',
                    description: 'Bank wire transfer (SEPA/SWIFT)',
                    minAmount: 100,
                    maxAmount: 1000000,
                    fee: 0,
                    estimatedTime: '1-3 business days',
                    currencies: ['EUR', 'USD', 'GBP']
                },
                {
                    id: 'crypto',
                    name: 'Cryptocurrency',
                    description: 'Deposit crypto and convert to fiat',
                    minAmount: 10,
                    maxAmount: null,
                    fee: 0,
                    estimatedTime: '10-60 minutes',
                    supportedCoins: ['BTC', 'ETH', 'USDT', 'USDC', 'SOL']
                },
                {
                    id: 'mobile_money',
                    name: 'Mobile Money',
                    description: 'MTN, Orange, M-Pesa, Wave, etc.',
                    minAmount: 1,
                    maxAmount: 5000,
                    fee: 0,
                    estimatedTime: '1-5 minutes',
                    availableCountries: ['CI', 'SN', 'GH', 'KE', 'UG', 'MA']
                }
            ]
        };
    }
}
