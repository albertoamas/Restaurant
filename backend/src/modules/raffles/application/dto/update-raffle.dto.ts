import { IsArray, IsInt, IsOptional, IsString, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class UpdateRafflePrizeDto {
  @IsInt()
  @Min(1)
  position: number;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  prizeDescription: string;
}

export class UpdateRaffleDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateRafflePrizeDto)
  prizes?: UpdateRafflePrizeDto[];
}
