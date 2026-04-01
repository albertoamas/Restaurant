import { IsEnum, IsNumber, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';
import { ExpenseCategory } from '@pos/shared';

export class CreateExpenseDto {
  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;
}
