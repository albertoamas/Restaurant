import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { ReportController } from './infrastructure/controllers/report.controller';

@Module({
  imports: [OrdersModule],
  controllers: [ReportController],
})
export class ReportsModule {}
