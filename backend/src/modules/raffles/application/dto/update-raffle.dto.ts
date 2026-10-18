import { IsArray, IsInt, IsOptional, IsString, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { trim } from './trim';

class UpdateRafflePrizeDto {
  @IsInt()
  @Min(1)
  position: number;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  prizeDescription: string;
}

export class UpdateRaffleDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateRafflePrizeDto)
  prizes?: UpdateRafflePrizeDto[];
}
