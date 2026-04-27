import {
  ArrayMinSize,
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

  @IsIn(['PRODUCT_MATCH', 'SPENDING_THRESHOLD'])
  ticketMode: RaffleTicketMode;

  /**
   * Requerido cuando ticketMode === 'PRODUCT_MATCH'.
   * Ignorado (y rechazado si se envía) cuando ticketMode === 'SPENDING_THRESHOLD'.
   */
  @ValidateIf((o: CreateRaffleDto) => o.ticketMode === 'PRODUCT_MATCH')
  @IsUUID()
  productId?: string;

  /**
   * Requerido cuando ticketMode === 'SPENDING_THRESHOLD'. Monto en Bs (entero > 0).
   * Ignorado cuando ticketMode === 'PRODUCT_MATCH'.
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
