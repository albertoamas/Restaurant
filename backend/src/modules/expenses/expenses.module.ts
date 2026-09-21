import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsModule } from '../events/events.module';
import { BranchModule } from '../branch/branch.module';
import { CashSessionModule } from '../cash-session/cash-session.module';
import { EXPENSE_REPOSITORY_PORT } from './domain/ports/expense-repository.port';
import { EXPENSE_CATEGORY_REPOSITORY_PORT } from './domain/ports/expense-category-repository.port';
import { EXPENSE_CONCEPT_REPOSITORY_PORT } from './domain/ports/expense-concept-repository.port';
import { ExpenseRepository } from './infrastructure/persistence/expense.repository';
import { ExpenseCategoryRepository } from './infrastructure/persistence/expense-category.repository';
import { ExpenseConceptRepository } from './infrastructure/persistence/expense-concept.repository';
import { ExpenseController } from './infrastructure/controllers/expense.controller';
import { CreateExpenseUseCase } from './application/use-cases/create-expense.use-case';
import { ListExpensesUseCase } from './application/use-cases/list-expenses.use-case';
import { DeleteExpenseUseCase } from './application/use-cases/delete-expense.use-case';
import { GetExpenseSummaryUseCase } from './application/use-cases/get-expense-summary.use-case';
import { CreateExpenseCategoryUseCase } from './application/use-cases/create-expense-category.use-case';
import { ListExpenseCategoriesUseCase } from './application/use-cases/list-expense-categories.use-case';
import { DeleteExpenseCategoryUseCase } from './application/use-cases/delete-expense-category.use-case';
import { UpdateExpenseCategoryUseCase } from './application/use-cases/update-expense-category.use-case';
import { UpdateExpenseUseCase } from './application/use-cases/update-expense.use-case';
import { ListExpenseConceptsUseCase } from './application/use-cases/list-expense-concepts.use-case';
import { CreateExpenseConceptUseCase } from './application/use-cases/create-expense-concept.use-case';
import { UpdateExpenseConceptUseCase } from './application/use-cases/update-expense-concept.use-case';
import { DeleteExpenseConceptUseCase } from './application/use-cases/delete-expense-concept.use-case';
import { EnsureDefaultExpenseConceptsUseCase } from './application/use-cases/ensure-default-expense-concepts.use-case';

@Module({
  imports: [PrismaModule, EventsModule, BranchModule, CashSessionModule],
  controllers: [ExpenseController],
  providers: [
    { provide: EXPENSE_REPOSITORY_PORT,          useClass: ExpenseRepository },
    { provide: EXPENSE_CATEGORY_REPOSITORY_PORT, useClass: ExpenseCategoryRepository },
    { provide: EXPENSE_CONCEPT_REPOSITORY_PORT,  useClass: ExpenseConceptRepository },
    CreateExpenseUseCase,
    ListExpensesUseCase,
    DeleteExpenseUseCase,
    GetExpenseSummaryUseCase,
    CreateExpenseCategoryUseCase,
    ListExpenseCategoriesUseCase,
    DeleteExpenseCategoryUseCase,
    UpdateExpenseCategoryUseCase,
    UpdateExpenseUseCase,
    ListExpenseConceptsUseCase,
    EnsureDefaultExpenseConceptsUseCase,
    CreateExpenseConceptUseCase,
    UpdateExpenseConceptUseCase,
    DeleteExpenseConceptUseCase,
  ],
})
export class ExpensesModule {}
