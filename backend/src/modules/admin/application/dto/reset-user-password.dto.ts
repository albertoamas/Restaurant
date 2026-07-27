import { IsString, MaxLength, MinLength } from 'class-validator';

export class ResetUserPasswordDto {
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  newPassword: string;
}
