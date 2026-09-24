import { IsBoolean, IsOptional } from 'class-validator';
import { TenantModules } from '../../../tenant/domain/entities/tenant.entity';

export class UpdateModulesDto implements Partial<TenantModules> {
  @IsOptional() @IsBoolean() ordersEnabled?:   boolean;
  @IsOptional() @IsBoolean() cashEnabled?:     boolean;
  @IsOptional() @IsBoolean() teamEnabled?:     boolean;
  @IsOptional() @IsBoolean() branchesEnabled?: boolean;
  @IsOptional() @IsBoolean() kitchenEnabled?:  boolean;
  @IsOptional() @IsBoolean() rafflesEnabled?:  boolean;
  @IsOptional() @IsBoolean() advancedReportsEnabled?: boolean;
}

/**
 * `implements Partial<TenantModules>` no obliga a exponer todos los módulos: un
 * flag nuevo compilaba igual y el admin recibía 400 al intentar tocarlo
 * (ValidationPipe corre con `forbidNonWhitelisted`). Esto rompe el build y
 * nombra el flag que falta.
 */
type ModulosSinExponer = Exclude<keyof TenantModules, keyof UpdateModulesDto>;
const _todosLosModulosExpuestos: [ModulosSinExponer] extends [never]
  ? true
  : ['Falta agregar estos módulos a UpdateModulesDto:', ModulosSinExponer] = true;
void _todosLosModulosExpuestos;
