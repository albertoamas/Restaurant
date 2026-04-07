import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsModule } from '../events/events.module';
import { EXPENSE_REPOSITORY_PORT } from './domain/ports/expense-repository.port';
import { ExpenseRepository } from './infrastructure/persistence/expense.repository';
import { ExpenseController } from './infrastructure/controllers/expense.controller';
import { CreateExpenseUseCase } from './application/use-cases/create-expense.use-case';
import { ListExpensesUseCase } from './application/use-cases/list-expenses.use-case';
import { DeleteExpenseUseCase } from './application/use-cases/delete-expense.use-case';
import { GetExpenseSummaryUseCase } from './application/use-cases/get-expense-summary.use-case';

@Module({
  imports: [PrismaModule, EventsModule],
  controllers: [ExpenseController],
  providers: [
    { provide: EXPENSE_REPOSITORY_PORT, useClass: ExpenseRepository },
    CreateExpenseUseCase,
    ListExpensesUseCase,
    DeleteExpenseUseCase,
    GetExpenseSummaryUseCase,
  ],
})
export class ExpensesModule {}
