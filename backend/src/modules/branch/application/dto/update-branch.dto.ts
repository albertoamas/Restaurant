import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateBranchDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  @Transform(({ value }) => value?.trim())
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Transform(({ value }) => value?.trim())
  phone?: string;
}
