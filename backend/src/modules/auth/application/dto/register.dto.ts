import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  businessName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  ownerName: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password: string;

  /** Nombre de la primera sucursal. Vacío o ausente -> se crea "Principal". */
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  @ValidateIf((_, value) => !!value)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  branchName?: string;
}
