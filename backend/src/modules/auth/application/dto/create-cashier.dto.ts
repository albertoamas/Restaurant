import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateCashierDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;
}
