import { IsBoolean, IsOptional } from 'class-validator';
import { TenantModules } from '../../tenant/domain/entities/tenant.entity';

export class UpdateModulesDto implements Partial<TenantModules> {
  @IsOptional() @IsBoolean() ordersEnabled?:   boolean;
  @IsOptional() @IsBoolean() cashEnabled?:     boolean;
  @IsOptional() @IsBoolean() teamEnabled?:     boolean;
  @IsOptional() @IsBoolean() branchesEnabled?: boolean;
  @IsOptional() @IsBoolean() kitchenEnabled?:  boolean;
  @IsOptional() @IsBoolean() rafflesEnabled?:  boolean;
}
