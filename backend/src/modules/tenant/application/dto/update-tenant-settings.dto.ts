import { IsEnum, IsOptional, IsString, Matches, MaxLength, ValidateIf } from 'class-validator';
import { OrderNumberResetPeriod } from '@pos/shared';
import { TenantSettings } from '../../domain/entities/tenant.entity';

const LOGO_URL_REGEX = /^(\/uploads\/[\w.-]{1,200}|https?:\/\/.{1,400})$/;

export class UpdateTenantSettingsDto implements Partial<TenantSettings> {
  @IsOptional()
  @IsEnum(OrderNumberResetPeriod)
  orderNumberResetPeriod?: OrderNumberResetPeriod;

  @IsOptional()
  @ValidateIf((o) => o.logoUrl !== null)
  @IsString()
  @MaxLength(500)
  @Matches(LOGO_URL_REGEX, { message: 'logoUrl debe ser una ruta /uploads/... o una URL https válida' })
  logoUrl?: string | null;

  @IsOptional()
  @ValidateIf((o) => o.businessAddress !== null)
  @IsString()
  @MaxLength(255)
  businessAddress?: string | null;

  @IsOptional()
  @ValidateIf((o) => o.businessPhone !== null)
  @IsString()
  @MaxLength(50)
  businessPhone?: string | null;

  @IsOptional()
  @ValidateIf((o) => o.receiptSlogan !== null)
  @IsString()
  @MaxLength(255)
  receiptSlogan?: string | null;
}
