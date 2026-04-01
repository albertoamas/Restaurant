import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
