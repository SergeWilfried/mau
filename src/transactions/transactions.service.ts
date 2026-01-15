import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class TransactionsService {
  constructor(private supabaseService: SupabaseService) {}

  async getTransactions(
    userId: string,
    filters: {
      accountId?: string;
      type?: string;
      from?: string;
      to?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    let query = this.supabaseService
      .getAdminClient()
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (filters.accountId) query = query.eq('account_id', filters.accountId);
    if (filters.type) query = query.eq('type', filters.type);
    if (filters.from) query = query.gte('created_at', filters.from);
    if (filters.to) query = query.lte('created_at', filters.to);

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 20) - 1);

    if (error) throw new BadRequestException(error.message);

    return {
      transactions: data,
      total: count,
      limit: filters.limit || 20,
      offset: filters.offset || 0,
    };
  }

  async getRecentTransactions(userId: string, limit: number = 10) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new BadRequestException(error.message);
    return { transactions: data };
  }

  async getTransaction(userId: string, transactionId: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('user_id', userId)
      .single();

    if (error || !data) throw new NotFoundException('Transaction not found');
    return data;
  }

  async getPendingTransactions(userId: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return { transactions: data };
  }

  async searchTransactions(userId: string, query: string, limit: number = 20) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .or(`description.ilike.%${query}%,reference.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new BadRequestException(error.message);
    return { transactions: data, query, limit };
  }

  async getSpendingByCategory(userId: string, from: string, to: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('transactions')
      .select('metadata, amount')
      .eq('user_id', userId)
      .gte('created_at', from)
      .lte('created_at', to)
      .lt('amount', 0);

    if (error) throw new BadRequestException(error.message);

    // Group by category from metadata
    const categories = new Map<string, number>();
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

  async getSpendingSummary(userId: string, from: string, to: string, currency: string = 'EUR') {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('transactions')
      .select('amount, type')
      .eq('user_id', userId)
      .eq('currency', currency)
      .gte('created_at', from)
      .lte('created_at', to);

    if (error) throw new BadRequestException(error.message);

    let totalIncome = 0;
    let totalExpenses = 0;

    data?.forEach((tx) => {
      const amount = Number(tx.amount);
      if (amount > 0) {
        totalIncome += amount;
      } else {
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

  async createTransaction(transaction: {
    user_id: string;
    account_id: string;
    type: string;
    amount: number;
    currency: string;
    fee?: number;
    description?: string;
    reference?: string;
    status?: string;
    metadata?: object;
    related_transaction_id?: string;
  }) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('transactions')
      .insert({
        ...transaction,
        status: transaction.status || 'pending',
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async updateTransactionStatus(transactionId: string, status: string) {
    const updates: any = { status };
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    const { error } = await this.supabaseService
      .getAdminClient()
      .from('transactions')
      .update(updates)
      .eq('id', transactionId);

    if (error) throw new BadRequestException(error.message);
  }
}
