import { Module } from '@nestjs/common';
import { TenantModule } from '../tenant/tenant.module';
import { PlansModule } from '../plans/plans.module';
import { CommonModule } from '../../common/common.module';
import { BranchRepository } from './infrastructure/persistence/branch.repository';
import { BranchController } from './infrastructure/controllers/branch.controller';
import { CreateBranchUseCase } from './application/use-cases/create-branch.use-case';
import { ListBranchesUseCase } from './application/use-cases/list-branches.use-case';
import { UpdateBranchUseCase } from './application/use-cases/update-branch.use-case';
import { ToggleBranchUseCase } from './application/use-cases/toggle-branch.use-case';

@Module({
  imports: [TenantModule, PlansModule, CommonModule],
  controllers: [BranchController],
  providers: [
    { provide: 'BranchRepositoryPort', useClass: BranchRepository },
    CreateBranchUseCase,
    ListBranchesUseCase,
    UpdateBranchUseCase,
    ToggleBranchUseCase,
  ],
  exports: ['BranchRepositoryPort'],
})
export class BranchModule {}
