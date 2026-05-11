import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsModule } from '../events/events.module';
import { BranchModule } from '../branch/branch.module';
import { CashSessionModule } from '../cash-session/cash-session.module';
import { EXPENSE_REPOSITORY_PORT } from './domain/ports/expense-repository.port';
import { EXPENSE_CATEGORY_REPOSITORY_PORT } from './domain/ports/expense-category-repository.port';
import { ExpenseRepository } from './infrastructure/persistence/expense.repository';
import { ExpenseCategoryRepository } from './infrastructure/persistence/expense-category.repository';
import { ExpenseController } from './infrastructure/controllers/expense.controller';
import { CreateExpenseUseCase } from './application/use-cases/create-expense.use-case';
import { ListExpensesUseCase } from './application/use-cases/list-expenses.use-case';
import { DeleteExpenseUseCase } from './application/use-cases/delete-expense.use-case';
import { GetExpenseSummaryUseCase } from './application/use-cases/get-expense-summary.use-case';
import { CreateExpenseCategoryUseCase } from './application/use-cases/create-expense-category.use-case';
import { ListExpenseCategoriesUseCase } from './application/use-cases/list-expense-categories.use-case';
import { DeleteExpenseCategoryUseCase } from './application/use-cases/delete-expense-category.use-case';
import { UpdateExpenseUseCase } from './application/use-cases/update-expense.use-case';

@Module({
  imports: [PrismaModule, EventsModule, BranchModule, CashSessionModule],
  controllers: [ExpenseController],
  providers: [
    { provide: EXPENSE_REPOSITORY_PORT,          useClass: ExpenseRepository },
    { provide: EXPENSE_CATEGORY_REPOSITORY_PORT, useClass: ExpenseCategoryRepository },
    CreateExpenseUseCase,
    ListExpensesUseCase,
    DeleteExpenseUseCase,
    GetExpenseSummaryUseCase,
    CreateExpenseCategoryUseCase,
    ListExpenseCategoriesUseCase,
    DeleteExpenseCategoryUseCase,
    UpdateExpenseUseCase,
  ],
})
export class ExpensesModule {}
