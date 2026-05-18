import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { ReportController } from './infrastructure/controllers/report.controller';
import { GetDailyReportUseCase } from './application/use-cases/get-daily-report.use-case';
import { GetReportByRangeUseCase } from './application/use-cases/get-report-by-range.use-case';
import { GetTopProductsUseCase } from './application/use-cases/get-top-products.use-case';
import { GetTopCustomersUseCase } from './application/use-cases/get-top-customers.use-case';

@Module({
  imports: [OrdersModule],
  controllers: [ReportController],
  providers: [
    GetDailyReportUseCase,
    GetReportByRangeUseCase,
    GetTopProductsUseCase,
    GetTopCustomersUseCase,
  ],
})
export class ReportsModule {}
