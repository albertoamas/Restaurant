import { Module } from '@nestjs/common';
import { TenantModule } from '../modules/tenant/tenant.module';
import { ModuleGuard } from './guards/module.guard';

@Module({
  imports: [TenantModule],
  providers: [ModuleGuard],
  exports: [ModuleGuard],
})
export class CommonModule {}
