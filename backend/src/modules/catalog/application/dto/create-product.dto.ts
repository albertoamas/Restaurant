import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, MinLength } from 'class-validator';

export class CreateProductDto {
  @IsUUID()
  categoryId: string;

  @IsString()
  @MinLength(2)
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  imageUrl?: string | null;
}
