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
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../../supabase/supabase.service");
let StorageService = class StorageService {
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async uploadFile(bucket, path, file, contentType) {
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .storage.from(bucket)
            .upload(path, file, {
            contentType,
            upsert: false,
        });
        if (error) {
            throw new common_1.BadRequestException(error.message);
        }
        return data.path;
    }
    async uploadKycDocument(userId, documentType, file, fileName, contentType) {
        const path = `${userId}/${documentType}/${Date.now()}_${fileName}`;
        return this.uploadFile('kyc-documents', path, file, contentType);
    }
    async getSignedUrl(bucket, path, expiresIn = 3600) {
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .storage.from(bucket)
            .createSignedUrl(path, expiresIn);
        if (error) {
            throw new common_1.BadRequestException(error.message);
        }
        return data.signedUrl;
    }
    async deleteFile(bucket, path) {
        const { error } = await this.supabaseService
            .getAdminClient()
            .storage.from(bucket)
            .remove([path]);
        if (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async listFiles(bucket, folder) {
        const { data, error } = await this.supabaseService
            .getAdminClient()
            .storage.from(bucket)
            .list(folder);
        if (error) {
            throw new common_1.BadRequestException(error.message);
        }
        return data;
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], StorageService);
//# sourceMappingURL=storage.service.js.map