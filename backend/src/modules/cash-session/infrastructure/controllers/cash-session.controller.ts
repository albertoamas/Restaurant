import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { CurrentTenant, CurrentUser, JwtPayload } from '../../../../common/decorators/tenant.decorator';
import { OpenCashSessionDto } from '../../application/dto/open-cash-session.dto';
import { CloseCashSessionDto } from '../../application/dto/close-cash-session.dto';
import { OpenCashSessionUseCase } from '../../application/use-cases/open-cash-session.use-case';
import { CloseCashSessionUseCase } from '../../application/use-cases/close-cash-session.use-case';
import { GetCurrentSessionUseCase } from '../../application/use-cases/get-current-session.use-case';
import { GetSessionHistoryUseCase } from '../../application/use-cases/get-session-history.use-case';
import { BadRequestException } from '@nestjs/common';

@Controller('cash-sessions')
@UseGuards(JwtAuthGuard)
export class CashSessionController {
  constructor(
    private readonly openUseCase: OpenCashSessionUseCase,
    private readonly closeUseCase: CloseCashSessionUseCase,
    private readonly getCurrentUseCase: GetCurrentSessionUseCase,
    private readonly getHistoryUseCase: GetSessionHistoryUseCase,
  ) {}

  @Get('current')
  getCurrent(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Query('branchId') queryBranchId?: string,
  ) {
    const branchId = user.branchId ?? queryBranchId;
    if (!branchId) throw new BadRequestException('Selecciona una sucursal primero');
    return this.getCurrentUseCase.execute(tenantId, branchId);
  }

  @Get('history')
  getHistory(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Query('branchId') queryBranchId?: string,
    @Query('limit') limit?: string,
  ) {
    const branchId = user.branchId ?? queryBranchId;
    if (!branchId) throw new BadRequestException('Selecciona una sucursal primero');
    return this.getHistoryUseCase.execute(tenantId, branchId, limit ? Number(limit) : 20);
  }

  @Post('open')
  open(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: OpenCashSessionDto,
    @Query('branchId') queryBranchId?: string,
  ) {
    const branchId = user.branchId ?? queryBranchId;
    if (!branchId) throw new BadRequestException('Selecciona una sucursal primero');
    return this.openUseCase.execute(tenantId, branchId, user.sub, dto);
  }

  @Post('close')
  @HttpCode(HttpStatus.OK)
  close(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CloseCashSessionDto,
    @Query('branchId') queryBranchId?: string,
  ) {
    const branchId = user.branchId ?? queryBranchId;
    if (!branchId) throw new BadRequestException('Selecciona una sucursal primero');
    return this.closeUseCase.execute(tenantId, branchId, user.sub, dto);
  }
}
