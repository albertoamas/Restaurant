import { IsOptional, IsUUID } from 'class-validator';
import { ExpenseFieldsDto } from './expense-fields.dto';

export class CreateExpenseDto extends ExpenseFieldsDto {
  /** Solo el dueño la manda: el cajero registra en la sucursal de su sesión. */
  @IsOptional()
  @IsUUID()
  branchId?: string;
}
