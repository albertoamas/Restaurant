import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RafflePrizeInputDto {
  @IsInt()
  @Min(1)
  position: number;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  prizeDescription: string;
}

export class CreateRaffleDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @IsUUID()
  productId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsInt()
  @Min(1)
  @Max(10)
  numberOfWinners: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RafflePrizeInputDto)
  prizes: RafflePrizeInputDto[];
}
