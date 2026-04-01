import { IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class OpenCashSessionDto {
  @IsNumber()
  @Min(0)
  @Max(999999)
  openingAmount: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
