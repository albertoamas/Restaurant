import { IsInt, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateExpenseConceptDto {
  @IsUUID()
  categoryId: string;

  @IsString()
  @MaxLength(150)
  name: string;

  /** Unidad de medida (kg, litro, mes…). Si viene, el gasto pide cantidad × precio. */
  @IsOptional()
  @IsString()
  @MaxLength(20)
  unit?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  defaultUnitPrice?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
