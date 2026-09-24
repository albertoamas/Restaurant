import { Module } from '@nestjs/common';
import { TenantModule } from '../tenant/tenant.module';
import { PlansModule } from '../plans/plans.module';
import { UploadController } from './upload.controller';
import { StorageQuotaService } from './application/storage-quota.service';

@Module({
  imports: [TenantModule, PlansModule],
  controllers: [UploadController],
  providers: [StorageQuotaService],
  exports: [StorageQuotaService],
})
export class UploadModule {}
