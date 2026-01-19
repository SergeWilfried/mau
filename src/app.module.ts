import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase/supabase.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AccountsModule } from './accounts/accounts.module';
import { TransactionsModule } from './transactions/transactions.module';
import { TransfersModule } from './transfers/transfers.module';
import { ExchangeModule } from './exchange/exchange.module';
import { BeneficiariesModule } from './beneficiaries/beneficiaries.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CryptoModule } from './crypto/crypto.module';
import { AdminModule } from './admin/admin.module';
import { FundingModule } from './funding/funding.module';
import { PayoutsModule } from './payouts/payouts.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    CommonModule,
    AuthModule,
    UsersModule,
    AccountsModule,
    TransactionsModule,
    TransfersModule,
    ExchangeModule,
    BeneficiariesModule,
    NotificationsModule,
    CryptoModule,
    AdminModule,
    FundingModule,
    PayoutsModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
