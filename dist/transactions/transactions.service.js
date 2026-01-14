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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let TransactionsService = class TransactionsService {
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async getTransactions(userId, filters) {
        let query = this.supabaseService
            .getAdminClient()
            .from('transactions')
            .select('*', { count: 'exact' })
            .eq('user_id', userId);
        if (filters.accountId)
            query = query.eq('account_id', filters.accountId);
        if (filters.type)
            query = query.eq('type', filters.type);
        if (filters.from)
            query = query.gte('created_at', filters.from);
        if (filters.to)
            query = query.lte('created_at', filters.to);
        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 20) - 1);
        if (error)
            throw new common_1.BadRequestException(error.message);
        return {
            transactions: data,
            total: count,
            limit: filters.limit || 20,
            offset: filters.offset || 0,
        };
    }
    async getTransaction(userId, transactionId) {
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('transactions')
            .select('*')
            .eq('id', transactionId)
            .eq('user_id', userId)
            .single();
        if (error || !data)
            throw new common_1.NotFoundException('Transaction not found');
        return data;
    }
    async getPendingTransactions(userId) {
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .in('status', ['pending', 'processing'])
            .order('created_at', { ascending: false });
        if (error)
            throw new common_1.BadRequestException(error.message);
        return { transactions: data };
    }
    async searchTransactions(userId, query, limit = 20) {
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .or(`description.ilike.%${query}%,reference.ilike.%${query}%`)
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error)
            throw new common_1.BadRequestException(error.message);
        return { transactions: data, query, limit };
    }
    async getSpendingByCategory(userId, from, to) {
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('transactions')
            .select('metadata, amount')
            .eq('user_id', userId)
            .gte('created_at', from)
            .lte('created_at', to)
            .lt('amount', 0);
        if (error)
            throw new common_1.BadRequestException(error.message);
        const categories = new Map();
        let total = 0;
        data?.forEach((tx) => {
            const category = tx.metadata?.category || 'Other';
            const amount = Math.abs(Number(tx.amount));
            categories.set(category, (categories.get(category) || 0) + amount);
            total += amount;
        });
        const result = Array.from(categories.entries()).map(([name, amount]) => ({
            name,
            amount,
            percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
        }));
        return { categories: result };
    }
    async getSpendingSummary(userId, from, to, currency = 'EUR') {
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('transactions')
            .select('amount, type')
            .eq('user_id', userId)
            .eq('currency', currency)
            .gte('created_at', from)
            .lte('created_at', to);
        if (error)
            throw new common_1.BadRequestException(error.message);
        let totalIncome = 0;
        let totalExpenses = 0;
        data?.forEach((tx) => {
            const amount = Number(tx.amount);
            if (amount > 0) {
                totalIncome += amount;
            }
            else {
                totalExpenses += Math.abs(amount);
            }
        });
        return {
            totalIncome,
            totalExpenses,
            netBalance: totalIncome - totalExpenses,
            currency,
        };
    }
    async createTransaction(transaction) {
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('transactions')
            .insert({
            ...transaction,
            status: transaction.status || 'pending',
        })
            .select()
            .single();
        if (error)
            throw new common_1.BadRequestException(error.message);
        return data;
    }
    async updateTransactionStatus(transactionId, status) {
        const updates = { status };
        if (status === 'completed') {
            updates.completed_at = new Date().toISOString();
        }
        const { error } = await this.supabaseService
            .getAdminClient()
            .from('transactions')
            .update(updates)
            .eq('id', transactionId);
        if (error)
            throw new common_1.BadRequestException(error.message);
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map