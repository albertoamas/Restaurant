import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string | null;

  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;
}
