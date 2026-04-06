import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '@pos/shared';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CurrentTenant, CurrentUser, JwtPayload } from '../../../../common/decorators/tenant.decorator';
import { LoginDto } from '../../application/dto/login.dto';
import { CreateCashierDto } from '../../application/dto/create-cashier.dto';
import { ChangePasswordDto } from '../../application/dto/change-password.dto';
import { GetProfileUseCase } from '../../application/use-cases/get-profile.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { CreateCashierUseCase } from '../../application/use-cases/create-cashier.use-case';
import { ListUsersUseCase } from '../../application/use-cases/list-users.use-case';
import { ToggleUserUseCase } from '../../application/use-cases/toggle-user.use-case';
import { ChangePasswordUseCase } from '../../application/use-cases/change-password.use-case';
import { UpdateUserBranchUseCase } from '../../application/use-cases/update-user-branch.use-case';
import { VerifyPasswordUseCase } from '../../application/use-cases/verify-password.use-case';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly createCashierUseCase: CreateCashierUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly toggleUserUseCase: ToggleUserUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly verifyPasswordUseCase: VerifyPasswordUseCase,
    private readonly updateUserBranchUseCase: UpdateUserBranchUseCase,
  ) {}

  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  login(@Body() dto: LoginDto) {
    return this.loginUseCase.execute(dto);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Request() req: { user: { sub: string; tenantId: string } }) {
    return this.getProfileUseCase.execute(req.user.sub, req.user.tenantId);
  }

  // ── Perfil propio (cualquier usuario autenticado) ─────────────

  @Post('me/verify-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  verifyPassword(
    @CurrentUser() user: JwtPayload,
    @Body('password') password: string,
  ) {
    return this.verifyPasswordUseCase.execute(user.sub, user.tenantId, password);
  }

  @Patch('me/password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.changePasswordUseCase.execute(user.sub, user.tenantId, dto);
  }

  // ── Gestión de usuarios (solo OWNER) ─────────────────────────

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  listUsers(@CurrentTenant() tenantId: string) {
    return this.listUsersUseCase.execute(tenantId);
  }

  @Post('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  createCashier(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateCashierDto,
  ) {
    return this.createCashierUseCase.execute(tenantId, dto);
  }

  @Patch('users/:id/branch')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  updateUserBranch(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @Body('branchId') branchId: string | null,
  ) {
    return this.updateUserBranchUseCase.execute(id, tenantId, branchId ?? null);
  }

  @Patch('users/:id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  toggleUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.toggleUserUseCase.execute(id, tenantId, user.sub);
  }
}
