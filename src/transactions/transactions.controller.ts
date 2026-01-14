import { Controller, Get, Param, Query } from '@nestjs/common';

@Controller('transactions')
export class TransactionsController {
  // GET /transactions - List all transactions with filters
  @Get()
  getTransactions(
    @Query('accountId') accountId?: string,
    @Query('type') type?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit: number = 20,
    @Query('offset') offset: number = 0,
  ) {
    return {
      transactions: [
        {
          id: '1',
          type: 'transfer_in',
          amount: 100.0,
          currency: 'EUR',
          description: 'Payment from John',
          createdAt: '2024-01-15T10:00:00Z',
          status: 'completed',
        },
      ],
      total: 1,
      limit,
      offset,
    };
  }

  // GET /transactions/:transactionId - Get transaction details
  @Get(':transactionId')
  getTransaction(@Param('transactionId') transactionId: string) {
    return {
      id: transactionId,
      type: 'transfer_out',
      amount: 50.0,
      currency: 'EUR',
      description: 'Payment to Jane',
      createdAt: '2024-01-15T10:00:00Z',
      status: 'completed',
      fee: 0,
      exchangeRate: null,
      sender: { name: 'John Doe', accountId: '1' },
      recipient: { name: 'Jane Doe', iban: 'GB00BANK00000000002' },
      reference: 'REF123456',
    };
  }

  // GET /transactions/pending - List pending transactions
  @Get('status/pending')
  getPendingTransactions() {
    return { transactions: [] };
  }

  // GET /transactions/search - Search transactions
  @Get('search/query')
  searchTransactions(
    @Query('q') query: string,
    @Query('limit') limit: number = 20,
  ) {
    return { transactions: [], query, limit };
  }

  // GET /transactions/categories - Get spending by category
  @Get('analytics/categories')
  getSpendingByCategory(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return {
      categories: [
        { name: 'Food & Drink', amount: 250.0, percentage: 25 },
        { name: 'Transport', amount: 100.0, percentage: 10 },
        { name: 'Shopping', amount: 150.0, percentage: 15 },
      ],
    };
  }

  // GET /transactions/analytics/summary - Get spending summary
  @Get('analytics/summary')
  getSpendingSummary(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('currency') currency: string = 'EUR',
  ) {
    return {
      totalIncome: 5000.0,
      totalExpenses: 3000.0,
      netBalance: 2000.0,
      currency,
    };
  }
}
