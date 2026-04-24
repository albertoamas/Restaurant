import { BadRequestException, Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { CurrentTenant, CurrentUser, JwtPayload } from '../../../../common/decorators/tenant.decorator';
import { OrderRepositoryPort } from '../../../orders/domain/ports/order-repository.port';
import { toBoliviaDateString, getBoliviaTodayBoundsISO } from '../../../../common/utils/timezone.util';

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
    @CurrentUser() user: JwtPayload,
    @Query('date') date?: string,
    @Query('branchId') branchId?: string,
  ) {
    validateISODate(date, 'date');
    // Default: fecha de hoy en hora Bolivia, no UTC
    const reportDate = date || toBoliviaDateString(new Date());
    const effectiveBranchId = user.branchId ?? branchId ?? null;
    return this.orderRepository.getDailyReport(tenantId, reportDate, effectiveBranchId);
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
    // Default: inicio y fin del día de hoy en hora Bolivia
    const { start: defaultStart, end: defaultEnd } = getBoliviaTodayBoundsISO();
    const effectiveBranchId = user.branchId ?? branchId ?? null;
    return this.orderRepository.getReportByRange(
      tenantId,
      effectiveBranchId,
      from || defaultStart,
      to   || defaultEnd,
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
    const { start: defaultStart, end: defaultEnd } = getBoliviaTodayBoundsISO();
    const effectiveBranchId = user.branchId ?? branchId ?? null;
    return this.orderRepository.getTopProducts(
      tenantId,
      effectiveBranchId,
      from || defaultStart,
      to   || defaultEnd,
      categoryId,
    );
  }

  @Get('top-customers')
  getTopCustomers(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('branchId') branchId?: string,
  ) {
    validateISODate(from, 'from');
    validateISODate(to, 'to');
    const { start: defaultStart, end: defaultEnd } = getBoliviaTodayBoundsISO();
    const effectiveBranchId = user.branchId ?? branchId ?? null;
    return this.orderRepository.getTopCustomers(
      tenantId,
      effectiveBranchId,
      from || defaultStart,
      to   || defaultEnd,
    );
  }
}
