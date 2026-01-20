import { Module } from '@nestjs/common';
import { CryptoController } from './crypto.controller';
import { CryptoService } from './crypto.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { AccountsModule } from '../accounts/accounts.module';

@Module({
    imports: [SupabaseModule, AccountsModule],
    controllers: [CryptoController],
    providers: [CryptoService],
    exports: [CryptoService]
})
export class CryptoModule {}
