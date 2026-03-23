import { Controller, Get, Query, UseGuards, Inject } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../../../common/decorators/tenant.decorator';
import { OrderRepositoryPort } from '../../../orders/domain/ports/order-repository.port';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportController {
  constructor(
    @Inject('OrderRepositoryPort')
    private readonly orderRepository: OrderRepositoryPort,
  ) {}

  @Get('daily')
  async getDailyReport(
    @CurrentTenant() tenantId: string,
    @Query('date') date?: string,
  ) {
    const reportDate = date || new Date().toISOString().split('T')[0];
    return this.orderRepository.getDailyReport(tenantId, reportDate);
  }
}
