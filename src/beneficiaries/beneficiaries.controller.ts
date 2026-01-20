import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { BeneficiariesService } from './beneficiaries.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('beneficiaries')
@UseGuards(AuthGuard)
export class BeneficiariesController {
    constructor(private readonly beneficiariesService: BeneficiariesService) {}

    // GET /beneficiaries - List all saved beneficiaries
    @Get()
    getBeneficiaries(
        @CurrentUser() user: any,
        @Query('type') type?: 'bank' | 'p2p' | 'mobilemoney | crypto',
        @Query('search') search?: string
    ) {
        return this.beneficiariesService.getBeneficiaries(user.id, type, search);
    }

    // GET /beneficiaries/recent - Get recently used beneficiaries
    @Get('list/recent')
    getRecentBeneficiaries(@CurrentUser() user: any, @Query('limit') limit: number = 5) {
        return this.beneficiariesService.getRecentBeneficiaries(user.id, limit);
    }

    // POST /beneficiaries/validate-iban - Validate IBAN
    @Post('validate-iban')
    validateIban(@Body() body: { iban: string }) {
        return this.beneficiariesService.validateIban(body.iban);
    }

    // POST /beneficiaries - Add new beneficiary
    @Post()
    addBeneficiary(
        @CurrentUser() user: any,
        @Body()
        body: {
            type: 'bank' | 'p2p' | 'mobilemoney' | 'crypto';
            name: string;
            iban?: string;
            bic?: string;
            phone?: string;
            email?: string;
            crypto_address?: string;
            crypto_network?: string;
            currency?: string;
        }
    ) {
        return this.beneficiariesService.addBeneficiary(user.id, body);
    }

    // GET /beneficiaries/:id - Get beneficiary details
    @Get(':id')
    getBeneficiary(@CurrentUser() user: any, @Param('id') id: string) {
        return this.beneficiariesService.getBeneficiary(user.id, id);
    }

    // PUT /beneficiaries/:id - Update beneficiary
    @Put(':id')
    updateBeneficiary(
        @CurrentUser() user: any,
        @Param('id') id: string,
        @Body() body: { name?: string; is_favorite?: boolean }
    ) {
        return this.beneficiariesService.updateBeneficiary(user.id, id, body);
    }

    // DELETE /beneficiaries/:id - Delete beneficiary
    @Delete(':id')
    deleteBeneficiary(@CurrentUser() user: any, @Param('id') id: string) {
        return this.beneficiariesService.deleteBeneficiary(user.id, id);
    }

    // POST /beneficiaries/:id/favorite - Mark as favorite
    @Post(':id/favorite')
    markFavorite(@CurrentUser() user: any, @Param('id') id: string) {
        return this.beneficiariesService.markFavorite(user.id, id);
    }

    // DELETE /beneficiaries/:id/favorite - Remove from favorites
    @Delete(':id/favorite')
    removeFavorite(@CurrentUser() user: any, @Param('id') id: string) {
        return this.beneficiariesService.removeFavorite(user.id, id);
    }
}
