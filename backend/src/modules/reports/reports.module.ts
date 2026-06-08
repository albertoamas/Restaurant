import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { ReportController } from './infrastructure/controllers/report.controller';
import { GetDailyReportUseCase } from './application/use-cases/get-daily-report.use-case';
import { GetReportByRangeUseCase } from './application/use-cases/get-report-by-range.use-case';
import { GetTopProductsUseCase } from './application/use-cases/get-top-products.use-case';
import { GetTopCustomersUseCase } from './application/use-cases/get-top-customers.use-case';
import { GetDailySeriesUseCase } from './application/use-cases/get-daily-series.use-case';
import { GetByCashierUseCase } from './application/use-cases/get-by-cashier.use-case';
import { GetTopCategoriesUseCase } from './application/use-cases/get-top-categories.use-case';
import { GetByHourUseCase } from './application/use-cases/get-by-hour.use-case';
import { GetCashSessionsReportUseCase } from './application/use-cases/get-cash-sessions-report.use-case';
import { GetByDayHourUseCase } from './application/use-cases/get-by-day-hour.use-case';

@Module({
  imports: [OrdersModule],
  controllers: [ReportController],
  providers: [
    GetDailyReportUseCase,
    GetReportByRangeUseCase,
    GetTopProductsUseCase,
    GetTopCustomersUseCase,
    GetDailySeriesUseCase,
    GetByCashierUseCase,
    GetTopCategoriesUseCase,
    GetByHourUseCase,
    GetCashSessionsReportUseCase,
    GetByDayHourUseCase,
  ],
})
export class ReportsModule {}
