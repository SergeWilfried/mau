import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BridgeService } from './bridge.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AccountsModule } from 'src/accounts/accounts.module';
import { SupabaseModule } from 'src/supabase/supabase.module';

@Module({
    imports: [
        HttpModule.registerAsync({
            imports: [ConfigModule, SupabaseModule, AccountsModule],
            useFactory: async (configService: ConfigService) => ({
                baseURL: 'https://api.bridge.xyz/v0',
                headers: {
                    'API-Key': configService.get<string>('BRIDGE_API_KEY'),
                    'Content-Type': 'application/json'
                }
            }),
            inject: [ConfigService]
        })
    ],
    providers: [BridgeService],
    exports: [BridgeService]
})
export class BridgeModule {}
