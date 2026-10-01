import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { PaymentMethod } from '@pos/shared';

/** Topes de las columnas: `quantity` es Decimal(10,3) y los importes Decimal(10,2). */
export const MAX_ITEM_QUANTITY   = 9_999_999;
export const MAX_EXPENSE_AMOUNT  = 99_999_999.99;

export class ExpenseItemDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  conceptId?: string;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  unit?: string;

  @IsNumber()
  @IsPositive()
  @Max(MAX_ITEM_QUANTITY)
  quantity: number;

  @IsNumber()
  @IsPositive()
  @Max(MAX_EXPENSE_AMOUNT)
  unitPrice: number;
}

/**
 * Campos comunes de registrar y editar un gasto. En los textos opcionales, `undefined` es "no
 * lo toques" (al editar) y la cadena vacía lo borra.
 */
export class ExpenseFieldsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ExpenseItemDto)
  items: ExpenseItemDto[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  /** Día del gasto en hora de Bolivia (YYYY-MM-DD). */
  @IsOptional()
  @IsDateString()
  expenseDate?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  supplierName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  documentNumber?: string;
}
