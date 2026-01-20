import { Controller, Get, Post, Query, Body } from '@nestjs/common';

@Controller('exchange')
export class ExchangeController {
    // GET /exchange/rates - Get current exchange rates
    @Get('rates')
    getRates(@Query('base') base: string = 'EUR') {
        return {
            base,
            timestamp: new Date().toISOString(),
            rates: {
                USD: 1.08,
                GBP: 0.86,
                MAD: 10.85,
                CHF: 0.94,
                JPY: 162.5,
                CAD: 1.47
            }
        };
    }

    // GET /exchange/rate - Get specific exchange rate
    @Get('rate')
    getRate(@Query('from') from: string, @Query('to') to: string, @Query('amount') amount?: number) {
        return {
            from,
            to,
            rate: 1.08,
            amount: amount || 1,
            convertedAmount: (amount || 1) * 1.08,
            fee: 0,
            timestamp: new Date().toISOString()
        };
    }

    // POST /exchange/convert - Convert currency between accounts
    @Post('convert')
    convert(@Body() body: { fromAccountId: string; toAccountId: string; fromAmount?: number; toAmount?: number }) {
        return {
            transactionId: '200',
            fromAmount: body.fromAmount || 100,
            fromCurrency: 'EUR',
            toAmount: 108,
            toCurrency: 'USD',
            rate: 1.08,
            fee: 0,
            status: 'completed'
        };
    }

    // POST /exchange/quote - Get exchange quote before converting
    @Post('quote')
    getQuote(@Body() body: { fromCurrency: string; toCurrency: string; fromAmount?: number; toAmount?: number }) {
        return {
            fromCurrency: body.fromCurrency,
            toCurrency: body.toCurrency,
            fromAmount: body.fromAmount || 100,
            toAmount: 108,
            rate: 1.08,
            fee: 0,
            expiresAt: new Date(Date.now() + 30000).toISOString(),
            quoteId: 'quote_123'
        };
    }

    // POST /exchange/execute - Execute a quoted exchange
    @Post('execute')
    executeQuote(@Body() body: { quoteId: string; fromAccountId: string; toAccountId: string }) {
        return {
            transactionId: '201',
            status: 'completed',
            message: 'Exchange completed successfully'
        };
    }

    // GET /exchange/supported-currencies - List supported currencies
    @Get('supported-currencies')
    getSupportedCurrencies() {
        return {
            currencies: [
                { code: 'EUR', name: 'Euro', symbol: '€' },
                { code: 'USD', name: 'US Dollar', symbol: '$' },
                { code: 'GBP', name: 'British Pound', symbol: '£' },
                { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.' },
                { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
                { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
                { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' }
            ]
        };
    }

    // GET /exchange/history - Get exchange history
    @Get('history')
    getExchangeHistory(@Query('limit') limit: number = 20, @Query('offset') offset: number = 0) {
        return { exchanges: [], total: 0, limit, offset };
    }
}
