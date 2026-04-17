import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

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

  @IsOptional()
  @IsString()
  @MaxLength(500)
  prizeDescription?: string;
}
