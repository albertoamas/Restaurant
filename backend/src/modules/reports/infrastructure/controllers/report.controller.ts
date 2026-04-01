import { BadRequestException, Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { CurrentTenant, CurrentUser, JwtPayload } from '../../../../common/decorators/tenant.decorator';
import { OrderRepositoryPort } from '../../../orders/domain/ports/order-repository.port';

function validateISODate(val: string | undefined, name: string): void {
  if (val === undefined) return;
  if (isNaN(new Date(val).getTime())) throw new BadRequestException(`Invalid date for '${name}': ${val}`);
}

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportController {
  constructor(
    @Inject('OrderRepositoryPort')
    private readonly orderRepository: OrderRepositoryPort,
  ) {}

  @Get('daily')
  getDailyReport(
    @CurrentTenant() tenantId: string,
    @Query('date') date?: string,
  ) {
    validateISODate(date, 'date');
    const reportDate = date || new Date().toISOString().split('T')[0];
    return this.orderRepository.getDailyReport(tenantId, reportDate);
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
    const nowUtc = new Date().toISOString();
    const effectiveBranchId = user.branchId ?? branchId ?? null;
    return this.orderRepository.getReportByRange(
      tenantId,
      effectiveBranchId,
      from || nowUtc,
      to || nowUtc,
    );
  }

  @Get('top-products')
  getTopProducts(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('branchId') branchId?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    validateISODate(from, 'from');
    validateISODate(to, 'to');
    const nowUtc = new Date().toISOString();
    const effectiveBranchId = user.branchId ?? branchId ?? null;
    return this.orderRepository.getTopProducts(
      tenantId,
      effectiveBranchId,
      from || nowUtc,
      to || nowUtc,
      categoryId,
    );
  }
}
