import { BadRequestException, Controller, Get, ParseIntPipe, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@pos/shared';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CurrentTenant, CurrentUser, JwtPayload } from '../../../../common/decorators/tenant.decorator';
import { GetDailyReportUseCase } from '../../application/use-cases/get-daily-report.use-case';
import { GetReportByRangeUseCase } from '../../application/use-cases/get-report-by-range.use-case';
import { GetTopProductsUseCase } from '../../application/use-cases/get-top-products.use-case';
import { GetTopCustomersUseCase } from '../../application/use-cases/get-top-customers.use-case';

function validateISODate(val: string | undefined, name: string): void {
  if (val === undefined) return;
  if (isNaN(new Date(val).getTime())) throw new BadRequestException(`Invalid date for '${name}': ${val}`);
}

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER)
export class ReportController {
  constructor(
    private readonly getDailyReportUseCase: GetDailyReportUseCase,
    private readonly getReportByRangeUseCase: GetReportByRangeUseCase,
    private readonly getTopProductsUseCase: GetTopProductsUseCase,
    private readonly getTopCustomersUseCase: GetTopCustomersUseCase,
  ) {}

  @Get('daily')
  getDailyReport(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Query('date') date?: string,
    @Query('branchId') branchId?: string,
  ) {
    validateISODate(date, 'date');
    const effectiveBranchId = user.branchId ?? branchId ?? null;
    return this.getDailyReportUseCase.execute(tenantId, effectiveBranchId, date);
  }

  @Get('range')
  getReportByRange(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('branchId') branchId?: string,
  ) {
    validateISODate(from, 'from');
    validateISODate(to, 'to');
    const effectiveBranchId = user.branchId ?? branchId ?? null;
    return this.getReportByRangeUseCase.execute(tenantId, effectiveBranchId, from, to);
  }

  @Get('top-products')
  getTopProducts(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('branchId') branchId?: string,
    @Query('categoryId', new ParseUUIDPipe({ optional: true })) categoryId?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    validateISODate(from, 'from');
    validateISODate(to, 'to');
    const effectiveBranchId = user.branchId ?? branchId ?? null;
    return this.getTopProductsUseCase.execute(tenantId, effectiveBranchId, from, to, categoryId, limit);
  }

  @Get('top-customers')
  getTopCustomers(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('branchId') branchId?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    validateISODate(from, 'from');
    validateISODate(to, 'to');
    const effectiveBranchId = user.branchId ?? branchId ?? null;
    return this.getTopCustomersUseCase.execute(tenantId, effectiveBranchId, from, to, limit);
  }
}
