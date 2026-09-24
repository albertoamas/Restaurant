import { Module } from '@nestjs/common';
import { TenantModule } from '../modules/tenant/tenant.module';
import { ModuleGuard } from './guards/module.guard';
import { ReportHistoryGuard } from './guards/report-history.guard';
import { PlansModule } from '../modules/plans/plans.module';

@Module({
  imports: [TenantModule, PlansModule],
  providers: [ModuleGuard, ReportHistoryGuard],
  // Se reexportan TenantModule y PlansModule porque Nest instancia un guard
  // referenciado por clase en @UseGuards dentro del módulo del controlador: sin
  // los puertos visibles ahí, el guard no se puede construir.
  exports: [ModuleGuard, ReportHistoryGuard, TenantModule, PlansModule],
})
export class CommonModule {}
