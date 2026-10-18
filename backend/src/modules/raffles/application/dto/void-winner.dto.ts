import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { trim } from './trim';

export class VoidWinnerDto {
  @Transform(trim)
  @IsString()
  @MinLength(3, { message: 'Indica el motivo de la anulación' })
  @MaxLength(500)
  reason: string;
}
