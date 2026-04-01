import { IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CloseCashSessionDto {
  @IsNumber()
  @Min(0)
  @Max(999999)
  closingAmount: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
