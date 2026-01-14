import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';

@Controller('accounts')
export class AccountsController {
  // GET /accounts - List all user accounts (multi-currency)
  @Get()
  getAccounts() {
    return {
      accounts: [
        { id: '1', currency: 'EUR', balance: 1000.0, isMain: true },
        { id: '2', currency: 'USD', balance: 500.0, isMain: false },
      ],
    };
  }

  // POST /accounts - Create new currency account
  @Post()
  createAccount(@Body() body: { currency: string }) {
    return { id: '3', currency: body.currency, balance: 0, isMain: false };
  }

  // GET /accounts/:accountId - Get specific account details
  @Get(':accountId')
  getAccount(@Param('accountId') accountId: string) {
    return { id: accountId, currency: 'EUR', balance: 1000.0, iban: 'GB00REVO00000000001' };
  }

  // GET /accounts/:accountId/details - Get account bank details (IBAN, BIC)
  @Get(':accountId/details')
  getAccountDetails(@Param('accountId') accountId: string) {
    return {
      iban: 'GB00REVO00000000001',
      bic: 'REVOGB21',
      accountHolder: 'John Doe',
      bankName: 'DouniPay',
      bankAddress: '123 Finance Street',
    };
  }

  // PUT /accounts/:accountId/main - Set as main account
  @Put(':accountId/main')
  setMainAccount(@Param('accountId') accountId: string) {
    return { message: 'Main account updated successfully' };
  }

  // GET /accounts/total-balance - Get total balance in preferred currency
  @Get('summary/total-balance')
  getTotalBalance(@Query('currency') currency: string = 'EUR') {
    return { totalBalance: 1500.0, currency };
  }

  // GET /accounts/:accountId/statements - Get account statements
  @Get(':accountId/statements')
  getStatements(
    @Param('accountId') accountId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return { statements: [], accountId, from, to };
  }

  // POST /accounts/:accountId/statements/export - Export statement (PDF/CSV)
  @Post(':accountId/statements/export')
  exportStatement(
    @Param('accountId') accountId: string,
    @Body() body: { format: 'pdf' | 'csv'; from: string; to: string },
  ) {
    return { downloadUrl: 'https://example.com/statement.pdf' };
  }
}
