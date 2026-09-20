import { IsOptional, IsString, MaxLength } from 'class-validator';

export class VoidExpenseDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}
