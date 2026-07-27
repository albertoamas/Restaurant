import { IsEnum, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { OrderNumberResetPeriod } from '@pos/shared';
import { TenantSettings } from '../../domain/entities/tenant.entity';

export class UpdateTenantSettingsDto implements Partial<TenantSettings> {
  @IsOptional()
  @IsEnum(OrderNumberResetPeriod)
  orderNumberResetPeriod?: OrderNumberResetPeriod;

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
