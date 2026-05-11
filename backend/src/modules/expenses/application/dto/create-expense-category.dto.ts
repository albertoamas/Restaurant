import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateExpenseCategoryDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  icon?: string;
}
