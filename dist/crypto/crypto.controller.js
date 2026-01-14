"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoController = void 0;
const common_1 = require("@nestjs/common");
let CryptoController = class CryptoController {
    getPortfolio(currency = 'EUR') {
        return {
            totalValue: 5000.0,
            currency,
            totalProfitLoss: 250.0,
            totalProfitLossPercentage: 5.26,
            assets: [
                {
                    symbol: 'BTC',
                    name: 'Bitcoin',
                    balance: 0.05,
                    value: 2500.0,
                    price: 50000.0,
                    profitLoss: 150.0,
                    profitLossPercentage: 6.38,
                    allocation: 50,
                },
                {
                    symbol: 'ETH',
                    name: 'Ethereum',
                    balance: 1.5,
                    value: 2500.0,
                    price: 1666.67,
                    profitLoss: 100.0,
                    profitLossPercentage: 4.17,
                    allocation: 50,
                },
            ],
        };
    }
    getAssets(search) {
        return {
            assets: [
                { symbol: 'BTC', name: 'Bitcoin', icon: 'btc.png', tradeable: true },
                { symbol: 'ETH', name: 'Ethereum', icon: 'eth.png', tradeable: true },
                { symbol: 'USDT', name: 'Tether', icon: 'usdt.png', tradeable: true },
                { symbol: 'SOL', name: 'Solana', icon: 'sol.png', tradeable: true },
                { symbol: 'XRP', name: 'Ripple', icon: 'xrp.png', tradeable: true },
                { symbol: 'DOGE', name: 'Dogecoin', icon: 'doge.png', tradeable: true },
            ],
        };
    }
    getAsset(symbol) {
        return {
            symbol,
            name: 'Bitcoin',
            description: 'The first decentralized cryptocurrency',
            price: 50000.0,
            marketCap: 980000000000,
            volume24h: 25000000000,
            change24h: 2.5,
            change7d: 8.3,
            high24h: 51000.0,
            low24h: 49000.0,
            allTimeHigh: 69000.0,
            circulatingSupply: 19600000,
            maxSupply: 21000000,
        };
    }
    getPrices(symbols, currency = 'EUR') {
        return {
            currency,
            prices: {
                BTC: { price: 50000.0, change24h: 2.5 },
                ETH: { price: 1666.67, change24h: 1.8 },
                SOL: { price: 120.0, change24h: -1.2 },
                XRP: { price: 0.65, change24h: 3.1 },
            },
            timestamp: new Date().toISOString(),
        };
    }
    getChart(symbol, period = '1d', currency = 'EUR') {
        return {
            symbol,
            period,
            currency,
            data: [
                { timestamp: '2024-01-15T00:00:00Z', price: 49500.0 },
                { timestamp: '2024-01-15T06:00:00Z', price: 49800.0 },
                { timestamp: '2024-01-15T12:00:00Z', price: 50200.0 },
                { timestamp: '2024-01-15T18:00:00Z', price: 50000.0 },
            ],
        };
    }
    buyCrypto(body) {
        return {
            transactionId: 'crypto_001',
            type: 'buy',
            symbol: body.symbol,
            amount: body.amount || 0.001,
            price: 50000.0,
            fiatAmount: body.fiatAmount || 50.0,
            fee: 0.5,
            status: 'completed',
            executedAt: new Date().toISOString(),
        };
    }
    sellCrypto(body) {
        return {
            transactionId: 'crypto_002',
            type: 'sell',
            symbol: body.symbol,
            amount: body.amount || 0.001,
            price: 50000.0,
            fiatAmount: body.fiatAmount || 50.0,
            fee: 0.5,
            status: 'completed',
            executedAt: new Date().toISOString(),
        };
    }
    swapCrypto(body) {
        return {
            transactionId: 'crypto_003',
            type: 'swap',
            fromSymbol: body.fromSymbol,
            toSymbol: body.toSymbol,
            fromAmount: body.fromAmount || 0.01,
            toAmount: 0.15,
            rate: 15.0,
            fee: 0.001,
            status: 'completed',
            executedAt: new Date().toISOString(),
        };
    }
    getQuote(body) {
        return {
            quoteId: 'quote_crypto_001',
            type: body.type,
            symbol: body.symbol || body.fromSymbol,
            amount: body.amount || 0.001,
            price: 50000.0,
            fiatAmount: body.fiatAmount || 50.0,
            fee: 0.5,
            total: 50.5,
            expiresAt: new Date(Date.now() + 30000).toISOString(),
        };
    }
    executeQuote(body) {
        return {
            transactionId: 'crypto_004',
            status: 'completed',
            message: 'Trade executed successfully',
        };
    }
    getWallets() {
        return {
            wallets: [
                {
                    symbol: 'BTC',
                    network: 'bitcoin',
                    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
                    balance: 0.05,
                },
                {
                    symbol: 'ETH',
                    network: 'ethereum',
                    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f8C1a0',
                    balance: 1.5,
                },
            ],
        };
    }
    getWallet(symbol, network) {
        return {
            symbol,
            network: network || 'mainnet',
            address: '0x742d35Cc6634C0532925a3b844Bc9e7595f8C1a0',
            balance: 1.5,
            networks: [
                { name: 'Ethereum', network: 'ethereum', fee: 0.001 },
                { name: 'Polygon', network: 'polygon', fee: 0.0001 },
                { name: 'Arbitrum', network: 'arbitrum', fee: 0.0005 },
            ],
        };
    }
    generateAddress(symbol, body) {
        return {
            symbol,
            network: body.network || 'mainnet',
            address: '0x742d35Cc6634C0532925a3b844Bc9e7595f8C1a0',
            memo: null,
            qrCode: 'base64_qr_code',
        };
    }
    withdraw(body) {
        return {
            withdrawalId: 'withdrawal_001',
            symbol: body.symbol,
            amount: body.amount,
            address: body.address,
            network: body.network,
            fee: 0.0001,
            status: 'pending',
            estimatedCompletion: '10-30 minutes',
        };
    }
    validateAddress(body) {
        return {
            valid: true,
            addressType: 'external',
            network: body.network,
            warning: null,
        };
    }
    getDeposits(symbol, limit = 20) {
        return { deposits: [], total: 0 };
    }
    getWithdrawals(symbol, limit = 20) {
        return { withdrawals: [], total: 0 };
    }
    createRecurringBuy(body) {
        return {
            recurringId: 'recurring_001',
            symbol: body.symbol,
            fiatAmount: body.fiatAmount,
            frequency: body.frequency,
            nextExecution: '2024-01-22T09:00:00Z',
            status: 'active',
        };
    }
    getRecurringBuys() {
        return { recurringBuys: [] };
    }
    pauseRecurring(id) {
        return { message: 'Recurring buy paused' };
    }
    resumeRecurring(id) {
        return { message: 'Recurring buy resumed' };
    }
    cancelRecurring(id) {
        return { message: 'Recurring buy cancelled' };
    }
    getStakingOptions() {
        return {
            options: [
                {
                    symbol: 'ETH',
                    apy: 4.5,
                    minStake: 0.01,
                    lockPeriod: null,
                    flexible: true,
                },
                {
                    symbol: 'SOL',
                    apy: 6.2,
                    minStake: 1,
                    lockPeriod: 30,
                    flexible: false,
                },
                {
                    symbol: 'DOT',
                    apy: 12.0,
                    minStake: 5,
                    lockPeriod: 28,
                    flexible: false,
                },
            ],
        };
    }
    stake(body) {
        return {
            stakeId: 'stake_001',
            symbol: body.symbol,
            amount: body.amount,
            apy: 4.5,
            startDate: new Date().toISOString(),
            endDate: body.lockPeriod
                ? new Date(Date.now() + body.lockPeriod * 24 * 60 * 60 * 1000).toISOString()
                : null,
            status: 'active',
        };
    }
    getActiveStakes() {
        return {
            stakes: [
                {
                    stakeId: 'stake_001',
                    symbol: 'ETH',
                    amount: 1.5,
                    apy: 4.5,
                    earned: 0.0023,
                    startDate: '2024-01-01T00:00:00Z',
                    status: 'active',
                },
            ],
            totalEarned: 0.0023,
        };
    }
    unstake(id) {
        return {
            message: 'Unstaking initiated',
            availableAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        };
    }
    getStakingRewards(symbol) {
        return { rewards: [], totalEarned: 0 };
    }
    getTransactions(symbol, type, limit = 20, offset = 0) {
        return {
            transactions: [
                {
                    id: 'crypto_001',
                    type: 'buy',
                    symbol: 'BTC',
                    amount: 0.001,
                    price: 50000.0,
                    fiatAmount: 50.0,
                    fee: 0.5,
                    status: 'completed',
                    createdAt: '2024-01-15T10:00:00Z',
                },
            ],
            total: 1,
            limit,
            offset,
        };
    }
    getTransaction(id) {
        return {
            id,
            type: 'buy',
            symbol: 'BTC',
            amount: 0.001,
            price: 50000.0,
            fiatAmount: 50.0,
            fee: 0.5,
            status: 'completed',
            txHash: null,
            createdAt: '2024-01-15T10:00:00Z',
        };
    }
    createAlert(body) {
        return {
            alertId: 'alert_001',
            symbol: body.symbol,
            targetPrice: body.targetPrice,
            condition: body.condition,
            status: 'active',
        };
    }
    getAlerts() {
        return { alerts: [] };
    }
    cancelAlert(id) {
        return { message: 'Alert cancelled' };
    }
};
exports.CryptoController = CryptoController;
__decorate([
    (0, common_1.Get)('portfolio'),
    __param(0, (0, common_1.Query)('currency')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CryptoController.prototype, "getPortfolio", null);
__decorate([
    (0, common_1.Get)('assets'),
    __param(0, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CryptoController.prototype, "getAssets", null);
__decorate([
    (0, common_1.Get)('assets/:symbol'),
    __param(0, (0, common_1.Param)('symbol')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CryptoController.prototype, "getAsset", null);
__decorate([
    (0, common_1.Get)('prices'),
    __param(0, (0, common_1.Query)('symbols')),
    __param(1, (0, common_1.Query)('currency')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], CryptoController.prototype, "getPrices", null);
__decorate([
    (0, common_1.Get)('assets/:symbol/chart'),
    __param(0, (0, common_1.Param)('symbol')),
    __param(1, (0, common_1.Query)('period')),
    __param(2, (0, common_1.Query)('currency')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], CryptoController.prototype, "getChart", null);
__decorate([
    (0, common_1.Post)('buy'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CryptoController.prototype, "buyCrypto", null);
__decorate([
    (0, common_1.Post)('sell'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CryptoController.prototype, "sellCrypto", null);
__decorate([
    (0, common_1.Post)('swap'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CryptoController.prototype, "swapCrypto", null);
__decorate([
    (0, common_1.Post)('quote'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CryptoController.prototype, "getQuote", null);
__decorate([
    (0, common_1.Post)('execute'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CryptoController.prototype, "executeQuote", null);
__decorate([
    (0, common_1.Get)('wallets'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CryptoController.prototype, "getWallets", null);
__decorate([
    (0, common_1.Get)('wallets/:symbol'),
    __param(0, (0, common_1.Param)('symbol')),
    __param(1, (0, common_1.Query)('network')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], CryptoController.prototype, "getWallet", null);
__decorate([
    (0, common_1.Post)('wallets/:symbol/address'),
    __param(0, (0, common_1.Param)('symbol')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CryptoController.prototype, "generateAddress", null);
__decorate([
    (0, common_1.Post)('withdraw'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CryptoController.prototype, "withdraw", null);
__decorate([
    (0, common_1.Post)('withdraw/validate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CryptoController.prototype, "validateAddress", null);
__decorate([
    (0, common_1.Get)('deposits'),
    __param(0, (0, common_1.Query)('symbol')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], CryptoController.prototype, "getDeposits", null);
__decorate([
    (0, common_1.Get)('withdrawals'),
    __param(0, (0, common_1.Query)('symbol')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], CryptoController.prototype, "getWithdrawals", null);
__decorate([
    (0, common_1.Post)('recurring'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CryptoController.prototype, "createRecurringBuy", null);
__decorate([
    (0, common_1.Get)('recurring'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CryptoController.prototype, "getRecurringBuys", null);
__decorate([
    (0, common_1.Post)('recurring/:id/pause'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CryptoController.prototype, "pauseRecurring", null);
__decorate([
    (0, common_1.Post)('recurring/:id/resume'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CryptoController.prototype, "resumeRecurring", null);
__decorate([
    (0, common_1.Post)('recurring/:id/cancel'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CryptoController.prototype, "cancelRecurring", null);
__decorate([
    (0, common_1.Get)('staking'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CryptoController.prototype, "getStakingOptions", null);
__decorate([
    (0, common_1.Post)('staking/stake'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CryptoController.prototype, "stake", null);
__decorate([
    (0, common_1.Get)('staking/active'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CryptoController.prototype, "getActiveStakes", null);
__decorate([
    (0, common_1.Post)('staking/:id/unstake'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CryptoController.prototype, "unstake", null);
__decorate([
    (0, common_1.Get)('staking/rewards'),
    __param(0, (0, common_1.Query)('symbol')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CryptoController.prototype, "getStakingRewards", null);
__decorate([
    (0, common_1.Get)('transactions'),
    __param(0, (0, common_1.Query)('symbol')),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Number]),
    __metadata("design:returntype", void 0)
], CryptoController.prototype, "getTransactions", null);
__decorate([
    (0, common_1.Get)('transactions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CryptoController.prototype, "getTransaction", null);
__decorate([
    (0, common_1.Post)('alerts'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CryptoController.prototype, "createAlert", null);
__decorate([
    (0, common_1.Get)('alerts'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CryptoController.prototype, "getAlerts", null);
__decorate([
    (0, common_1.Post)('alerts/:id/cancel'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CryptoController.prototype, "cancelAlert", null);
exports.CryptoController = CryptoController = __decorate([
    (0, common_1.Controller)('crypto')
], CryptoController);
//# sourceMappingURL=crypto.controller.js.map