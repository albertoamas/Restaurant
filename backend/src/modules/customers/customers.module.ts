import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsModule } from '../events/events.module';
import { CUSTOMER_REPOSITORY_PORT } from './domain/ports/customer-repository.port';
import { CustomerRepository } from './infrastructure/persistence/customer.repository';
import { CustomerController } from './infrastructure/controllers/customer.controller';
import { CreateCustomerUseCase } from './application/use-cases/create-customer.use-case';
import { ListCustomersUseCase } from './application/use-cases/list-customers.use-case';
import { GetCustomerUseCase } from './application/use-cases/get-customer.use-case';
import { UpdateCustomerUseCase } from './application/use-cases/update-customer.use-case';
import { SearchCustomersUseCase } from './application/use-cases/search-customers.use-case';
import { ToggleRaffleWinnerUseCase } from './application/use-cases/toggle-raffle-winner.use-case';

@Module({
  imports: [PrismaModule, EventsModule],
  controllers: [CustomerController],
  providers: [
    { provide: CUSTOMER_REPOSITORY_PORT, useClass: CustomerRepository },
    CreateCustomerUseCase,
    ListCustomersUseCase,
    GetCustomerUseCase,
    UpdateCustomerUseCase,
    SearchCustomersUseCase,
    ToggleRaffleWinnerUseCase,
  ],
  exports: [CUSTOMER_REPOSITORY_PORT],
})
export class CustomersModule {}
