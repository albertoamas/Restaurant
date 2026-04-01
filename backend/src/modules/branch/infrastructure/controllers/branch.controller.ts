import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@pos/shared';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CurrentTenant, CurrentUser, JwtPayload } from '../../../../common/decorators/tenant.decorator';
import { CreateBranchDto } from '../../application/dto/create-branch.dto';
import { UpdateBranchDto } from '../../application/dto/update-branch.dto';
import { CreateBranchUseCase } from '../../application/use-cases/create-branch.use-case';
import { ListBranchesUseCase } from '../../application/use-cases/list-branches.use-case';
import { UpdateBranchUseCase } from '../../application/use-cases/update-branch.use-case';
import { ToggleBranchUseCase } from '../../application/use-cases/toggle-branch.use-case';

@Controller('branches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BranchController {
  constructor(
    private readonly createBranchUseCase: CreateBranchUseCase,
    private readonly listBranchesUseCase: ListBranchesUseCase,
    private readonly updateBranchUseCase: UpdateBranchUseCase,
    private readonly toggleBranchUseCase: ToggleBranchUseCase,
  ) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.CASHIER)
  findAll(@CurrentTenant() tenantId: string) {
    return this.listBranchesUseCase.execute(tenantId);
  }

  @Post()
  @Roles(UserRole.OWNER)
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateBranchDto) {
    return this.createBranchUseCase.execute(tenantId, dto);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.CASHIER)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateBranchDto,
  ) {
    // Cashier can only edit their own branch
    if (user.role === UserRole.CASHIER && user.branchId !== id) {
      throw new ForbiddenException('Solo puedes editar tu propia sucursal');
    }
    return this.updateBranchUseCase.execute(id, tenantId, dto);
  }

  @Patch(':id/toggle')
  @Roles(UserRole.OWNER)
  toggle(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.toggleBranchUseCase.execute(id, tenantId);
  }
}
