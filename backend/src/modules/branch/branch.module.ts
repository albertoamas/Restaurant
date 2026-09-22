import { Module } from '@nestjs/common';
import { PlansModule } from '../plans/plans.module';
import { CommonModule } from '../../common/common.module';
import { BranchRepository } from './infrastructure/persistence/branch.repository';
import { BranchUsageRepository } from './infrastructure/persistence/branch-usage.repository';
import { BRANCH_USAGE_PORT } from './domain/ports/branch-usage.port';
import { BranchController } from './infrastructure/controllers/branch.controller';
import { BranchAccessService } from './application/services/branch-access.service';
import { CreateBranchUseCase } from './application/use-cases/create-branch.use-case';
import { ListBranchesUseCase } from './application/use-cases/list-branches.use-case';
import { UpdateBranchUseCase } from './application/use-cases/update-branch.use-case';
import { ToggleBranchUseCase } from './application/use-cases/toggle-branch.use-case';

@Module({
  imports: [PlansModule, CommonModule],
  controllers: [BranchController],
  providers: [
    { provide: 'BranchRepositoryPort', useClass: BranchRepository },
    { provide: BRANCH_USAGE_PORT,      useClass: BranchUsageRepository },
    BranchAccessService,
    CreateBranchUseCase,
    ListBranchesUseCase,
    UpdateBranchUseCase,
    ToggleBranchUseCase,
  ],
  exports: ['BranchRepositoryPort', BranchAccessService],
})
export class BranchModule {}
