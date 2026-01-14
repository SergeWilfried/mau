export declare class CryptoController {
    getPortfolio(currency?: string): {
        totalValue: number;
        currency: string;
        totalProfitLoss: number;
        totalProfitLossPercentage: number;
        assets: {
            symbol: string;
            name: string;
            balance: number;
            value: number;
            price: number;
            profitLoss: number;
            profitLossPercentage: number;
            allocation: number;
        }[];
    };
    getAssets(search?: string): {
        assets: {
            symbol: string;
            name: string;
            icon: string;
            tradeable: boolean;
        }[];
    };
    getAsset(symbol: string): {
        symbol: string;
        name: string;
        description: string;
        price: number;
        marketCap: number;
        volume24h: number;
        change24h: number;
        change7d: number;
        high24h: number;
        low24h: number;
        allTimeHigh: number;
        circulatingSupply: number;
        maxSupply: number;
    };
    getPrices(symbols?: string, currency?: string): {
        currency: string;
        prices: {
            BTC: {
                price: number;
                change24h: number;
            };
            ETH: {
                price: number;
                change24h: number;
            };
            SOL: {
                price: number;
                change24h: number;
            };
            XRP: {
                price: number;
                change24h: number;
            };
        };
        timestamp: string;
    };
    getChart(symbol: string, period?: '1h' | '1d' | '1w' | '1m' | '1y', currency?: string): {
        symbol: string;
        period: "1h" | "1d" | "1w" | "1m" | "1y";
        currency: string;
        data: {
            timestamp: string;
            price: number;
        }[];
    };
    buyCrypto(body: {
        symbol: string;
        amount?: number;
        fiatAmount?: number;
        fromAccountId: string;
    }): {
        transactionId: string;
        type: string;
        symbol: string;
        amount: number;
        price: number;
        fiatAmount: number;
        fee: number;
        status: string;
        executedAt: string;
    };
    sellCrypto(body: {
        symbol: string;
        amount?: number;
        fiatAmount?: number;
        toAccountId: string;
    }): {
        transactionId: string;
        type: string;
        symbol: string;
        amount: number;
        price: number;
        fiatAmount: number;
        fee: number;
        status: string;
        executedAt: string;
    };
    swapCrypto(body: {
        fromSymbol: string;
        toSymbol: string;
        fromAmount?: number;
        toAmount?: number;
    }): {
        transactionId: string;
        type: string;
        fromSymbol: string;
        toSymbol: string;
        fromAmount: number;
        toAmount: number;
        rate: number;
        fee: number;
        status: string;
        executedAt: string;
    };
    getQuote(body: {
        type: 'buy' | 'sell' | 'swap';
        fromSymbol?: string;
        toSymbol?: string;
        symbol?: string;
        amount?: number;
        fiatAmount?: number;
    }): {
        quoteId: string;
        type: "buy" | "sell" | "swap";
        symbol: string;
        amount: number;
        price: number;
        fiatAmount: number;
        fee: number;
        total: number;
        expiresAt: string;
    };
    executeQuote(body: {
        quoteId: string;
        fromAccountId?: string;
        toAccountId?: string;
    }): {
        transactionId: string;
        status: string;
        message: string;
    };
    getWallets(): {
        wallets: {
            symbol: string;
            network: string;
            address: string;
            balance: number;
        }[];
    };
    getWallet(symbol: string, network?: string): {
        symbol: string;
        network: string;
        address: string;
        balance: number;
        networks: {
            name: string;
            network: string;
            fee: number;
        }[];
    };
    generateAddress(symbol: string, body: {
        network?: string;
    }): {
        symbol: string;
        network: string;
        address: string;
        memo: any;
        qrCode: string;
    };
    withdraw(body: {
        symbol: string;
        amount: number;
        address: string;
        network: string;
        memo?: string;
    }): {
        withdrawalId: string;
        symbol: string;
        amount: number;
        address: string;
        network: string;
        fee: number;
        status: string;
        estimatedCompletion: string;
    };
    validateAddress(body: {
        symbol: string;
        address: string;
        network: string;
    }): {
        valid: boolean;
        addressType: string;
        network: string;
        warning: any;
    };
    getDeposits(symbol?: string, limit?: number): {
        deposits: any[];
        total: number;
    };
    getWithdrawals(symbol?: string, limit?: number): {
        withdrawals: any[];
        total: number;
    };
    createRecurringBuy(body: {
        symbol: string;
        fiatAmount: number;
        fromAccountId: string;
        frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
        dayOfWeek?: number;
        dayOfMonth?: number;
    }): {
        recurringId: string;
        symbol: string;
        fiatAmount: number;
        frequency: "daily" | "weekly" | "monthly" | "biweekly";
        nextExecution: string;
        status: string;
    };
    getRecurringBuys(): {
        recurringBuys: any[];
    };
    pauseRecurring(id: string): {
        message: string;
    };
    resumeRecurring(id: string): {
        message: string;
    };
    cancelRecurring(id: string): {
        message: string;
    };
    getStakingOptions(): {
        options: {
            symbol: string;
            apy: number;
            minStake: number;
            lockPeriod: number;
            flexible: boolean;
        }[];
    };
    stake(body: {
        symbol: string;
        amount: number;
        lockPeriod?: number;
    }): {
        stakeId: string;
        symbol: string;
        amount: number;
        apy: number;
        startDate: string;
        endDate: string;
        status: string;
    };
    getActiveStakes(): {
        stakes: {
            stakeId: string;
            symbol: string;
            amount: number;
            apy: number;
            earned: number;
            startDate: string;
            status: string;
        }[];
        totalEarned: number;
    };
    unstake(id: string): {
        message: string;
        availableAt: string;
    };
    getStakingRewards(symbol?: string): {
        rewards: any[];
        totalEarned: number;
    };
    getTransactions(symbol?: string, type?: 'buy' | 'sell' | 'swap' | 'deposit' | 'withdrawal' | 'staking', limit?: number, offset?: number): {
        transactions: {
            id: string;
            type: string;
            symbol: string;
            amount: number;
            price: number;
            fiatAmount: number;
            fee: number;
            status: string;
            createdAt: string;
        }[];
        total: number;
        limit: number;
        offset: number;
    };
    getTransaction(id: string): {
        id: string;
        type: string;
        symbol: string;
        amount: number;
        price: number;
        fiatAmount: number;
        fee: number;
        status: string;
        txHash: any;
        createdAt: string;
    };
    createAlert(body: {
        symbol: string;
        targetPrice: number;
        condition: 'above' | 'below';
        currency?: string;
    }): {
        alertId: string;
        symbol: string;
        targetPrice: number;
        condition: "above" | "below";
        status: string;
    };
    getAlerts(): {
        alerts: any[];
    };
    cancelAlert(id: string): {
        message: string;
    };
}
