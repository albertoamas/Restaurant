import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RaffleTicketMode } from '@pos/shared';

export class RafflePrizeInputDto {
  @IsInt()
  @Min(1)
  position: number;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  prizeDescription: string;
}

export class CreateRaffleDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  /** Los sorteos por producto ya no se crean: solo siguen los existentes. */
  @IsIn(['CATEGORY_MATCH', 'SPENDING_THRESHOLD'])
  ticketMode: Exclude<RaffleTicketMode, 'PRODUCT_MATCH'>;

  /**
   * Requerido cuando ticketMode === 'CATEGORY_MATCH': categorías cuyas unidades dan un ticket.
   * Rechazado si se envía con otro modo.
   */
  @ValidateIf((o: CreateRaffleDto) => o.ticketMode === 'CATEGORY_MATCH')
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  categoryIds?: string[];

  /**
   * Requerido cuando ticketMode === 'SPENDING_THRESHOLD'. Monto en Bs (entero > 0).
   * Rechazado si se envía con otro modo.
   */
  @ValidateIf((o: CreateRaffleDto) => o.ticketMode === 'SPENDING_THRESHOLD')
  @IsInt()
  @Min(1)
  spendingThreshold?: number;

  @IsInt()
  @Min(1)
  @Max(10)
  numberOfWinners: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RafflePrizeInputDto)
  prizes: RafflePrizeInputDto[];
}
