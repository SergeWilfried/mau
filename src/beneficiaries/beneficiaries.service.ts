import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class BeneficiariesService {
  constructor(private supabaseService: SupabaseService) {}

  async getBeneficiaries(userId: string, type?: string, search?: string) {
    let query = this.supabaseService
      .getAdminClient()
      .from('beneficiaries')
      .select('*')
      .eq('user_id', userId);

    if (type) query = query.eq('type', type);
    if (search) query = query.ilike('name', `%${search}%`);

    const { data, error } = await query.order('is_favorite', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return { beneficiaries: data };
  }

  async addBeneficiary(userId: string, beneficiary: {
    type: 'bank' | 'p2p' | 'mobilemoney' | 'crypto';
    name: string;
    iban?: string;
    bic?: string;
    phone?: string;
    email?: string;
    crypto_address?: string;
    crypto_network?: string;
    currency?: string;
  }) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('beneficiaries')
      .insert({ user_id: userId, ...beneficiary })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return { ...data, message: 'Beneficiary added successfully' };
  }

  async getBeneficiary(userId: string, beneficiaryId: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('beneficiaries')
      .select('*')
      .eq('id', beneficiaryId)
      .eq('user_id', userId)
      .single();

    if (error || !data) throw new NotFoundException('Beneficiary not found');
    return data;
  }

  async updateBeneficiary(userId: string, beneficiaryId: string, updates: {
    name?: string;
    is_favorite?: boolean;
  }) {
    const { error } = await this.supabaseService
      .getAdminClient()
      .from('beneficiaries')
      .update(updates)
      .eq('id', beneficiaryId)
      .eq('user_id', userId);

    if (error) throw new BadRequestException(error.message);
    return { message: 'Beneficiary updated successfully' };
  }

  async deleteBeneficiary(userId: string, beneficiaryId: string) {
    const { error } = await this.supabaseService
      .getAdminClient()
      .from('beneficiaries')
      .delete()
      .eq('id', beneficiaryId)
      .eq('user_id', userId);

    if (error) throw new BadRequestException(error.message);
    return { message: 'Beneficiary deleted successfully' };
  }

  async markFavorite(userId: string, beneficiaryId: string) {
    await this.updateBeneficiary(userId, beneficiaryId, { is_favorite: true });
    return { message: 'Beneficiary marked as favorite' };
  }

  async removeFavorite(userId: string, beneficiaryId: string) {
    await this.updateBeneficiary(userId, beneficiaryId, { is_favorite: false });
    return { message: 'Beneficiary removed from favorites' };
  }

  async getRecentBeneficiaries(userId: string, limit: number = 5) {
    const { data } = await this.supabaseService
      .getAdminClient()
      .from('beneficiaries')
      .select('*')
      .eq('user_id', userId)
      .not('last_used_at', 'is', null)
      .order('last_used_at', { ascending: false })
      .limit(limit);

    return { beneficiaries: data || [] };
  }

  async updateLastUsed(beneficiaryId: string) {
    await this.supabaseService
      .getAdminClient()
      .from('beneficiaries')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', beneficiaryId);
  }

  validateIban(iban: string) {
    // Basic IBAN validation
    const cleanIban = iban.replace(/\s/g, '').toUpperCase();
    const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/;

    if (!ibanRegex.test(cleanIban)) {
      return { valid: false, error: 'Invalid IBAN format' };
    }

    // In production, would do proper IBAN checksum validation
    return {
      valid: true,
      bankName: 'Bank Name', // Would lookup from BIC database
      bic: 'BANKXXX',
      country: cleanIban.substring(0, 2),
    };
  }
}
