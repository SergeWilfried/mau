import { Global, Module } from '@nestjs/common';
import { StorageService } from './services/storage.service';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Global()
@Module({
  providers: [StorageService, AuthGuard, RolesGuard],
  exports: [StorageService, AuthGuard, RolesGuard],
})
export class CommonModule {}
