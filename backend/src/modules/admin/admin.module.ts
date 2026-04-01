import { Module } from '@nestjs/common';
import { TenantModule } from '../tenant/tenant.module';
import { AuthModule } from '../auth/auth.module';
import { AdminController } from './admin.controller';

@Module({
  imports: [TenantModule, AuthModule],
  controllers: [AdminController],
})
export class AdminModule {}
