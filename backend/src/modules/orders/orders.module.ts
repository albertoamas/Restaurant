import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogModule } from '../catalog/catalog.module';
import { OrderOrmEntity } from './infrastructure/persistence/order.orm-entity';
import { OrderItemOrmEntity } from './infrastructure/persistence/order-item.orm-entity';
import { OrderRepository } from './infrastructure/persistence/order.repository';
import { OrderController } from './infrastructure/controllers/order.controller';
import { CreateOrderUseCase } from './application/use-cases/create-order.use-case';
import { ListOrdersUseCase } from './application/use-cases/list-orders.use-case';
import { GetOrderUseCase } from './application/use-cases/get-order.use-case';
import { UpdateOrderStatusUseCase } from './application/use-cases/update-order-status.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderOrmEntity, OrderItemOrmEntity]),
    CatalogModule,
  ],
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
  ],
  exports: ['OrderRepositoryPort'],
})
export class OrdersModule {}
