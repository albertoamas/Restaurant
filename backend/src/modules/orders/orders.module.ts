import { Module } from '@nestjs/common';
import { BranchModule } from '../branch/branch.module';
import { CatalogModule } from '../catalog/catalog.module';
import { EventsModule } from '../events/events.module';
import { CustomersModule } from '../customers/customers.module';
import { CashSessionModule } from '../cash-session/cash-session.module';
import { RafflesModule } from '../raffles/raffles.module';
import { CommonModule } from '../../common/common.module';
import { OrderRepository } from './infrastructure/persistence/order.repository';
import { OrderController } from './infrastructure/controllers/order.controller';
import { CreateOrderUseCase } from './application/use-cases/create-order.use-case';
import { ListOrdersUseCase } from './application/use-cases/list-orders.use-case';
import { GetOrderUseCase } from './application/use-cases/get-order.use-case';
import { UpdateOrderStatusUseCase } from './application/use-cases/update-order-status.use-case';
import { RegisterOrderPaymentUseCase } from './application/use-cases/register-order-payment.use-case';
import { EditOrderUseCase } from './application/use-cases/edit-order.use-case';
import { ResetOrderSequenceUseCase } from './application/use-cases/reset-order-sequence.use-case';

@Module({
  imports: [BranchModule, CatalogModule, EventsModule, CustomersModule, CashSessionModule, RafflesModule, CommonModule],
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
    EditOrderUseCase,
    ResetOrderSequenceUseCase,
  ],
  exports: ['OrderRepositoryPort'],
})
export class OrdersModule {}
