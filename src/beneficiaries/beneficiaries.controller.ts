import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';

@Controller('beneficiaries')
export class BeneficiariesController {
  // GET /beneficiaries - List all saved beneficiaries
  @Get()
  getBeneficiaries(
    @Query('type') type?: 'bank' | 'p2p' | 'mobilemoney',
    @Query('search') search?: string,
  ) {
    return {
      beneficiaries: [
        {
          id: '1',
          type: 'bank',
          name: 'Jane Doe',
          iban: 'GB00BANK00000000002',
          bic: 'BANKGB21',
          currency: 'EUR',
          isFavorite: true,
        },
      ],
    };
  }

  // POST /beneficiaries - Add new beneficiary
  @Post()
  addBeneficiary(
    @Body() body: {
      type: 'bank' | 'p2p';
      name: string;
      iban?: string;
      bic?: string;
      phone?: string;
      email?: string;
      currency?: string;
    },
  ) {
    return {
      id: '2',
      ...body,
      message: 'Beneficiary added successfully',
    };
  }

  // GET /beneficiaries/:id - Get beneficiary details
  @Get(':id')
  getBeneficiary(@Param('id') id: string) {
    return {
      id,
      type: 'bank',
      name: 'Jane Doe',
      iban: 'GB00BANK00000000002',
      bic: 'BANKGB21',
      currency: 'EUR',
      bankName: 'Example Bank',
      bankAddress: '123 Bank Street',
      isFavorite: true,
      createdAt: '2024-01-01T00:00:00Z',
    };
  }

  // PUT /beneficiaries/:id - Update beneficiary
  @Put(':id')
  updateBeneficiary(
    @Param('id') id: string,
    @Body() body: { name?: string; isFavorite?: boolean },
  ) {
    return { message: 'Beneficiary updated successfully' };
  }

  // DELETE /beneficiaries/:id - Delete beneficiary
  @Delete(':id')
  deleteBeneficiary(@Param('id') id: string) {
    return { message: 'Beneficiary deleted successfully' };
  }

  // POST /beneficiaries/:id/favorite - Mark as favorite
  @Post(':id/favorite')
  markFavorite(@Param('id') id: string) {
    return { message: 'Beneficiary marked as favorite' };
  }

  // DELETE /beneficiaries/:id/favorite - Remove from favorites
  @Delete(':id/favorite')
  removeFavorite(@Param('id') id: string) {
    return { message: 'Beneficiary removed from favorites' };
  }

  // POST /beneficiaries/validate-iban - Validate IBAN
  @Post('validate-iban')
  validateIban(@Body() body: { iban: string }) {
    return {
      valid: true,
      bankName: 'Example Bank',
      bic: 'BANKGB21',
      country: 'GB',
    };
  }

  // GET /beneficiaries/recent - Get recently used beneficiaries
  @Get('list/recent')
  getRecentBeneficiaries(@Query('limit') limit: number = 5) {
    return { beneficiaries: [] };
  }
}
