import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class UpdateExpenseItemDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsNumber()
  @IsPositive()
  unitPrice: number;
}

export class UpdateExpenseDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdateExpenseItemDto)
  items: UpdateExpenseItemDto[];

  @IsOptional()
  @IsString()
  description?: string;
}
