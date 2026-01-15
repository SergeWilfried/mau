import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('transactions')
@UseGuards(AuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  // GET /transactions - List all transactions with filters
  @Get()
  getTransactions(
    @CurrentUser() user: any,
    @Query('accountId') accountId?: string,
    @Query('type') type?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit: number = 20,
    @Query('offset') offset: number = 0,
  ) {
    return this.transactionsService.getTransactions(user.id, {
      accountId,
      type,
      from,
      to,
      limit,
      offset,
    });
  }

  // GET /transactions/recent - Get recent transactions
  @Get('recent')
  getRecentTransactions(
    @CurrentUser() user: any,
    @Query('limit') limit: number = 10,
  ) {
    return this.transactionsService.getRecentTransactions(user.id, limit);
  }

  // GET /transactions/pending - List pending transactions
  @Get('status/pending')
  getPendingTransactions(@CurrentUser() user: any) {
    return this.transactionsService.getPendingTransactions(user.id);
  }

  // GET /transactions/search - Search transactions
  @Get('search/query')
  searchTransactions(
    @CurrentUser() user: any,
    @Query('q') query: string,
    @Query('limit') limit: number = 20,
  ) {
    return this.transactionsService.searchTransactions(user.id, query, limit);
  }

  // GET /transactions/categories - Get spending by category
  @Get('analytics/categories')
  getSpendingByCategory(
    @CurrentUser() user: any,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.transactionsService.getSpendingByCategory(user.id, from, to);
  }

  // GET /transactions/analytics/summary - Get spending summary
  @Get('analytics/summary')
  getSpendingSummary(
    @CurrentUser() user: any,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('currency') currency: string = 'EUR',
  ) {
    return this.transactionsService.getSpendingSummary(user.id, from, to, currency);
  }

  // GET /transactions/:transactionId - Get transaction details (must be last due to param matching)
  @Get(':transactionId')
  getTransaction(
    @CurrentUser() user: any,
    @Param('transactionId') transactionId: string,
  ) {
    return this.transactionsService.getTransaction(user.id, transactionId);
  }
}
