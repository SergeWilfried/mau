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
exports.BeneficiariesService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let BeneficiariesService = class BeneficiariesService {
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async getBeneficiaries(userId, type, search) {
        let query = this.supabaseService
            .getAdminClient()
            .from('beneficiaries')
            .select('*')
            .eq('user_id', userId);
        if (type)
            query = query.eq('type', type);
        if (search)
            query = query.ilike('name', `%${search}%`);
        const { data, error } = await query.order('is_favorite', { ascending: false });
        if (error)
            throw new common_1.BadRequestException(error.message);
        return { beneficiaries: data };
    }
    async addBeneficiary(userId, beneficiary) {
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('beneficiaries')
            .insert({ user_id: userId, ...beneficiary })
            .select()
            .single();
        if (error)
            throw new common_1.BadRequestException(error.message);
        return { ...data, message: 'Beneficiary added successfully' };
    }
    async getBeneficiary(userId, beneficiaryId) {
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .from('beneficiaries')
            .select('*')
            .eq('id', beneficiaryId)
            .eq('user_id', userId)
            .single();
        if (error || !data)
            throw new common_1.NotFoundException('Beneficiary not found');
        return data;
    }
    async updateBeneficiary(userId, beneficiaryId, updates) {
        const { error } = await this.supabaseService
            .getAdminClient()
            .from('beneficiaries')
            .update(updates)
            .eq('id', beneficiaryId)
            .eq('user_id', userId);
        if (error)
            throw new common_1.BadRequestException(error.message);
        return { message: 'Beneficiary updated successfully' };
    }
    async deleteBeneficiary(userId, beneficiaryId) {
        const { error } = await this.supabaseService
            .getAdminClient()
            .from('beneficiaries')
            .delete()
            .eq('id', beneficiaryId)
            .eq('user_id', userId);
        if (error)
            throw new common_1.BadRequestException(error.message);
        return { message: 'Beneficiary deleted successfully' };
    }
    async markFavorite(userId, beneficiaryId) {
        await this.updateBeneficiary(userId, beneficiaryId, { is_favorite: true });
        return { message: 'Beneficiary marked as favorite' };
    }
    async removeFavorite(userId, beneficiaryId) {
        await this.updateBeneficiary(userId, beneficiaryId, { is_favorite: false });
        return { message: 'Beneficiary removed from favorites' };
    }
    async getRecentBeneficiaries(userId, limit = 5) {
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
    async updateLastUsed(beneficiaryId) {
        await this.supabaseService
            .getAdminClient()
            .from('beneficiaries')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', beneficiaryId);
    }
    validateIban(iban) {
        const cleanIban = iban.replace(/\s/g, '').toUpperCase();
        const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/;
        if (!ibanRegex.test(cleanIban)) {
            return { valid: false, error: 'Invalid IBAN format' };
        }
        return {
            valid: true,
            bankName: 'Bank Name',
            bic: 'BANKXXX',
            country: cleanIban.substring(0, 2),
        };
    }
};
exports.BeneficiariesService = BeneficiariesService;
exports.BeneficiariesService = BeneficiariesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], BeneficiariesService);
//# sourceMappingURL=beneficiaries.service.js.map