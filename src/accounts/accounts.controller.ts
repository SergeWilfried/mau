import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('accounts')
@UseGuards(AuthGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  // GET /accounts - List all user accounts (multi-currency)
  @Get()
  getAccounts(@CurrentUser() user: any) {
    return this.accountsService.getAccounts(user.id);
  }

  // POST /accounts - Create new currency account
  @Post()
  createAccount(@CurrentUser() user: any, @Body() body: { currency: string }) {
    return this.accountsService.createAccount(user.id, body.currency);
  }

  // GET /accounts/summary/total-balance - Get total balance in preferred currency
  // Note: This must come BEFORE :accountId routes to avoid matching "summary" as accountId
  @Get('summary/total-balance')
  getTotalBalance(@CurrentUser() user: any, @Query('currency') currency: string = 'EUR') {
    return this.accountsService.getTotalBalance(user.id, currency);
  }

  // GET /accounts/:accountId - Get specific account details
  @Get(':accountId')
  getAccount(@CurrentUser() user: any, @Param('accountId') accountId: string) {
    return this.accountsService.getAccount(user.id, accountId);
  }

  // GET /accounts/:accountId/details - Get account bank details (IBAN, BIC)
  @Get(':accountId/details')
  getAccountDetails(@CurrentUser() user: any, @Param('accountId') accountId: string) {
    return this.accountsService.getAccountDetails(user.id, accountId);
  }

  // PUT /accounts/:accountId/main - Set as main account
  @Put(':accountId/main')
  setMainAccount(@CurrentUser() user: any, @Param('accountId') accountId: string) {
    return this.accountsService.setMainAccount(user.id, accountId);
  }

  // GET /accounts/:accountId/statements - Get account statements
  @Get(':accountId/statements')
  getStatements(
    @CurrentUser() user: any,
    @Param('accountId') accountId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.accountsService.getStatements(user.id, accountId, from, to);
  }

  // POST /accounts/:accountId/statements/export - Export statement (PDF/CSV)
  @Post(':accountId/statements/export')
  exportStatement(
    @Param('accountId') accountId: string,
    @Body() body: { format: 'pdf' | 'csv'; from: string; to: string },
  ) {
    // TODO: Implement actual statement export
    return { downloadUrl: 'https://example.com/statement.pdf' };
  }
}
