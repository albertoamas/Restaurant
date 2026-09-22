import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

/**
 * `-1` significa "sin límite" en todos los numéricos, igual que en la BD.
 * `Min(-1)` deja pasar el 0, que se rechaza en el use-case con un mensaje
 * explicativo: un plan con 0 productos no es un plan, es un negocio bloqueado.
 */
export class UpdatePlanLimitsDto {
  @IsOptional() @IsString()          displayName?:    string;
  @IsOptional() @IsNumber() @Min(0)  priceBs?:        number;
  @IsOptional() @IsInt() @Min(-1)    maxBranches?:    number;
  @IsOptional() @IsInt() @Min(-1)    maxCashiers?:    number;
  @IsOptional() @IsInt() @Min(-1)    maxProducts?:    number;
  @IsOptional() @IsBoolean()         kitchenEnabled?: boolean;
  @IsOptional() @IsBoolean()         rafflesEnabled?: boolean;
  @IsOptional() @IsBoolean()         teamEnabled?:      boolean;
  @IsOptional() @IsBoolean()         advancedReports?:  boolean;
  @IsOptional() @IsInt() @Min(-1)    reportHistoryDays?: number;
  @IsOptional() @IsInt() @Min(-1)    maxStorageMb?:      number;
}
