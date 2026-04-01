import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

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
}
