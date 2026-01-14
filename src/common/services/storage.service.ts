import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class StorageService {
  constructor(private supabaseService: SupabaseService) {}

  async uploadFile(
    bucket: string,
    path: string,
    file: Buffer,
    contentType: string,
  ): Promise<string> {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .storage.from(bucket)
      .upload(path, file, {
        contentType,
        upsert: false,
      });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data.path;
  }

  async uploadKycDocument(
    userId: string,
    documentType: string,
    file: Buffer,
    fileName: string,
    contentType: string,
  ): Promise<string> {
    const path = `${userId}/${documentType}/${Date.now()}_${fileName}`;
    return this.uploadFile('kyc-documents', path, file, contentType);
  }

  async getSignedUrl(bucket: string, path: string, expiresIn: number = 3600): Promise<string> {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .storage.from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data.signedUrl;
  }

  async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await this.supabaseService
      .getAdminClient()
      .storage.from(bucket)
      .remove([path]);

    if (error) {
      throw new BadRequestException(error.message);
    }
  }

  async listFiles(bucket: string, folder: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .storage.from(bucket)
      .list(folder);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data;
  }
}
