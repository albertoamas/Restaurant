import { IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(9999)
  sortOrder?: number;
}
