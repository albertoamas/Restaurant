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
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ExpenseCategory, UserRole } from '@pos/shared';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CurrentTenant, CurrentUser, JwtPayload } from '../../../../common/decorators/tenant.decorator';
import { CreateExpenseUseCase } from '../../application/use-cases/create-expense.use-case';
import { ListExpensesUseCase } from '../../application/use-cases/list-expenses.use-case';
import { DeleteExpenseUseCase } from '../../application/use-cases/delete-expense.use-case';
import { GetExpenseSummaryUseCase } from '../../application/use-cases/get-expense-summary.use-case';
import { CreateExpenseDto } from '../../application/dto/create-expense.dto';
import { getBoliviaTodayBoundsISO } from '../../../../common/utils/timezone.util';

function validateISODate(val: string | undefined, name: string): void {
  if (val === undefined) return;
  if (isNaN(new Date(val).getTime())) throw new BadRequestException(`Invalid date for '${name}': ${val}`);
}

@Controller('expenses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER)
export class ExpenseController {
  constructor(
    private readonly createExpense: CreateExpenseUseCase,
    private readonly listExpenses: ListExpensesUseCase,
    private readonly deleteExpense: DeleteExpenseUseCase,
    private readonly getExpenseSummary: GetExpenseSummaryUseCase,
  ) {}

  @Post()
  create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateExpenseDto,
  ) {
    const branchId = user.branchId ?? dto.branchId;
    if (!branchId) throw new BadRequestException('branchId is required');
    return this.createExpense.execute(tenantId, branchId, user.sub, dto);
  }

  @Get()
  findAll(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('branchId') branchId?: string,
    @Query('category') category?: ExpenseCategory,
  ) {
    validateISODate(from, 'from');
    validateISODate(to, 'to');
    // Default: inicio y fin del día de hoy en hora Bolivia
    const { start: defaultStart, end: defaultEnd } = getBoliviaTodayBoundsISO();
    const effectiveBranchId = user.branchId ?? branchId ?? null;
    return this.listExpenses.execute(
      tenantId,
      effectiveBranchId,
      new Date(from || defaultStart),
      new Date(to   || defaultEnd),
      category,
    );
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
    // Default: inicio y fin del día de hoy en hora Bolivia
    const { start: defaultStart, end: defaultEnd } = getBoliviaTodayBoundsISO();
    const effectiveBranchId = user.branchId ?? branchId ?? null;
    return this.getExpenseSummary.execute(
      tenantId,
      effectiveBranchId,
      new Date(from || defaultStart),
      new Date(to   || defaultEnd),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.deleteExpense.execute(id, tenantId);
  }
}
