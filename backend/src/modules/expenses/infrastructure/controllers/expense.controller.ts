import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { UserRole } from '@pos/shared';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CurrentTenant, CurrentUser, JwtPayload } from '../../../../common/decorators/tenant.decorator';
import { CreateExpenseUseCase } from '../../application/use-cases/create-expense.use-case';
import { ListExpensesUseCase } from '../../application/use-cases/list-expenses.use-case';
import { VoidExpenseUseCase } from '../../application/use-cases/void-expense.use-case';
import { GetExpenseSummaryUseCase } from '../../application/use-cases/get-expense-summary.use-case';
import { GetExpenseItemSummaryUseCase } from '../../application/use-cases/get-expense-item-summary.use-case';
import { CreateExpenseCategoryUseCase } from '../../application/use-cases/create-expense-category.use-case';
import { ListExpenseCategoriesUseCase } from '../../application/use-cases/list-expense-categories.use-case';
import { DeleteExpenseCategoryUseCase } from '../../application/use-cases/delete-expense-category.use-case';
import { CreateExpenseDto } from '../../application/dto/create-expense.dto';
import { UpdateExpenseDto } from '../../application/dto/update-expense.dto';
import { VoidExpenseDto } from '../../application/dto/void-expense.dto';
import { CreateExpenseCategoryDto } from '../../application/dto/create-expense-category.dto';
import { UpdateExpenseCategoryDto } from '../../application/dto/update-expense-category.dto';
import { UpdateExpenseCategoryUseCase } from '../../application/use-cases/update-expense-category.use-case';
import { UpdateExpenseUseCase } from '../../application/use-cases/update-expense.use-case';
import { ListExpenseConceptsUseCase } from '../../application/use-cases/list-expense-concepts.use-case';
import { CreateExpenseConceptUseCase } from '../../application/use-cases/create-expense-concept.use-case';
import { UpdateExpenseConceptUseCase } from '../../application/use-cases/update-expense-concept.use-case';
import { DeleteExpenseConceptUseCase } from '../../application/use-cases/delete-expense-concept.use-case';
import { CreateExpenseConceptDto } from '../../application/dto/create-expense-concept.dto';
import { UpdateExpenseConceptDto } from '../../application/dto/update-expense-concept.dto';
import { LoadSuggestedCatalogDto } from '../../application/dto/load-suggested-catalog.dto';
import { LoadSuggestedExpenseCatalogUseCase } from '../../application/use-cases/load-suggested-expense-catalog.use-case';
import { getBoliviaTodayBoundsISO } from '../../../../common/utils/timezone.util';
import { scopedBranchId } from '../../../../common/utils/branch-scope';

function validateISODate(val: string | undefined, name: string): void {
  if (val === undefined) return;
  if (isNaN(new Date(val).getTime())) throw new BadRequestException(`Fecha no válida en '${name}': ${val}`);
}

@Controller('expenses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER)
export class ExpenseController {
  constructor(
    private readonly createExpense: CreateExpenseUseCase,
    private readonly listExpenses: ListExpensesUseCase,
    private readonly voidExpense: VoidExpenseUseCase,
    private readonly getExpenseSummary: GetExpenseSummaryUseCase,
    private readonly getExpenseItemSummary: GetExpenseItemSummaryUseCase,
    private readonly createExpenseCategory: CreateExpenseCategoryUseCase,
    private readonly listExpenseCategories: ListExpenseCategoriesUseCase,
    private readonly deleteExpenseCategory: DeleteExpenseCategoryUseCase,
    private readonly updateExpenseCategory: UpdateExpenseCategoryUseCase,
    private readonly updateExpense: UpdateExpenseUseCase,
    private readonly listExpenseConcepts: ListExpenseConceptsUseCase,
    private readonly createExpenseConcept: CreateExpenseConceptUseCase,
    private readonly updateExpenseConcept: UpdateExpenseConceptUseCase,
    private readonly deleteExpenseConcept: DeleteExpenseConceptUseCase,
    private readonly loadSuggestedCatalog: LoadSuggestedExpenseCatalogUseCase,
  ) {}

  // ── Expense categories ──────────────────────────────────────────

  @Get('categories')
  listCategories(@CurrentTenant() tenantId: string) {
    return this.listExpenseCategories.execute(tenantId);
  }

  @Post('categories')
  createCategory(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateExpenseCategoryDto,
  ) {
    return this.createExpenseCategory.execute(tenantId, dto);
  }

  @Patch('categories/:id')
  updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateExpenseCategoryDto,
  ) {
    return this.updateExpenseCategory.execute(id, tenantId, dto);
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.deleteExpenseCategory.execute(id, tenantId);
  }

  /** Carga las categorías elegidas del catálogo sugerido, con sus gastos. */
  @Post('catalog/suggested')
  loadSuggested(
    @CurrentTenant() tenantId: string,
    @Body() dto: LoadSuggestedCatalogDto,
  ) {
    return this.loadSuggestedCatalog.execute(tenantId, dto.categories);
  }

  // ── Gastos predefinidos (conceptos) ─────────────────────────────

  @Get('concepts')
  listConcepts(@CurrentTenant() tenantId: string) {
    return this.listExpenseConcepts.execute(tenantId);
  }

  @Post('concepts')
  createConcept(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateExpenseConceptDto,
  ) {
    return this.createExpenseConcept.execute(tenantId, dto);
  }

  @Patch('concepts/:id')
  updateConcept(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateExpenseConceptDto,
  ) {
    return this.updateExpenseConcept.execute(id, tenantId, dto);
  }

  @Delete('concepts/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteConcept(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.deleteExpenseConcept.execute(id, tenantId);
  }

  // ── Expenses ────────────────────────────────────────────────────

  @Post()
  create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateExpenseDto,
  ) {
    const branchId = user.branchId ?? dto.branchId;
    if (!branchId) throw new BadRequestException('Elige la sucursal del gasto');
    return this.createExpense.execute(tenantId, branchId, user.sub, dto);
  }

  @Get()
  async findAll(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('branchId') branchId?: string,
    @Query('category') category?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    validateISODate(from, 'from');
    validateISODate(to, 'to');
    const { start: defaultStart, end: defaultEnd } = getBoliviaTodayBoundsISO();
    const effectiveBranchId = user.branchId ?? branchId ?? null;
    // Sin `limit` responde como antes (todo el período); con `limit`, una página.
    const result = await this.listExpenses.execute(
      tenantId,
      effectiveBranchId,
      new Date(from || defaultStart),
      new Date(to   || defaultEnd),
      {
        category,
        q,
        page:  page  ? Number(page)  : undefined,
        limit: limit ? Number(limit) : undefined,
      },
    );
    res.setHeader('X-Total-Count', result.total);
    return result.data;
  }

  @Get('summary')
  summary(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('branchId') branchId?: string,
  ) {
    validateISODate(from, 'from');
    validateISODate(to, 'to');
    const { start: defaultStart, end: defaultEnd } = getBoliviaTodayBoundsISO();
    const effectiveBranchId = user.branchId ?? branchId ?? null;
    return this.getExpenseSummary.execute(
      tenantId,
      effectiveBranchId,
      new Date(from || defaultStart),
      new Date(to   || defaultEnd),
    );
  }

  /** Detalle por ítem de la pestaña Gastos de reportes. Mismos filtros que `summary`. */
  @Get('summary/items')
  itemSummary(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('branchId') branchId?: string,
  ) {
    validateISODate(from, 'from');
    validateISODate(to, 'to');
    const { start: defaultStart, end: defaultEnd } = getBoliviaTodayBoundsISO();
    return this.getExpenseItemSummary.execute(
      tenantId,
      scopedBranchId(user, branchId) ?? null,
      new Date(from || defaultStart),
      new Date(to   || defaultEnd),
    );
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.updateExpense.execute(id, tenantId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: VoidExpenseDto,
  ) {
    return this.voidExpense.execute(id, tenantId, user.sub, dto?.reason);
  }
}
