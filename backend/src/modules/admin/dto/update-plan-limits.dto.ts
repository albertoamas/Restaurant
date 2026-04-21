import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdatePlanLimitsDto {
  @IsOptional() @IsString()          displayName?:    string;
  @IsOptional() @IsNumber() @Min(0)  priceBs?:        number;
  @IsOptional() @IsNumber() @Min(-1) maxBranches?:    number;
  @IsOptional() @IsNumber() @Min(-1) maxCashiers?:    number;
  @IsOptional() @IsNumber() @Min(-1) maxProducts?:    number;
  @IsOptional() @IsBoolean()         kitchenEnabled?: boolean;
  @IsOptional() @IsBoolean()         rafflesEnabled?: boolean;
}
