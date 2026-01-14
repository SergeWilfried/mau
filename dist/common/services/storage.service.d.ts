import { SupabaseService } from '../../supabase/supabase.service';
export declare class StorageService {
    private supabaseService;
    constructor(supabaseService: SupabaseService);
    uploadFile(bucket: string, path: string, file: Buffer, contentType: string): Promise<string>;
    uploadKycDocument(userId: string, documentType: string, file: Buffer, fileName: string, contentType: string): Promise<string>;
    getSignedUrl(bucket: string, path: string, expiresIn?: number): Promise<string>;
    deleteFile(bucket: string, path: string): Promise<void>;
    listFiles(bucket: string, folder: string): Promise<import("@supabase/storage-js").FileObject[]>;
}
