import { Module } from '@nestjs/common';
import { BranchModule } from '../branch/branch.module';
import { CatalogModule } from '../catalog/catalog.module';
import { EventsModule } from '../events/events.module';
import { CustomersModule } from '../customers/customers.module';
import { CashSessionModule } from '../cash-session/cash-session.module';
import { TenantModule } from '../tenant/tenant.module';
import { OrderRepository } from './infrastructure/persistence/order.repository';
import { OrderController } from './infrastructure/controllers/order.controller';
import { CreateOrderUseCase } from './application/use-cases/create-order.use-case';
import { ListOrdersUseCase } from './application/use-cases/list-orders.use-case';
import { GetOrderUseCase } from './application/use-cases/get-order.use-case';
import { UpdateOrderStatusUseCase } from './application/use-cases/update-order-status.use-case';
import { RegisterOrderPaymentUseCase } from './application/use-cases/register-order-payment.use-case';

@Module({
  imports: [BranchModule, CatalogModule, EventsModule, CustomersModule, CashSessionModule, TenantModule],
  controllers: [OrderController],
  providers: [
    {
      provide: 'OrderRepositoryPort',
      useClass: OrderRepository,
    },
    CreateOrderUseCase,
    ListOrdersUseCase,
    GetOrderUseCase,
    UpdateOrderStatusUseCase,
    RegisterOrderPaymentUseCase,
  ],
  exports: ['OrderRepositoryPort'],
})
export class OrdersModule {}
