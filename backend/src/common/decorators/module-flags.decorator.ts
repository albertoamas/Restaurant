import { SetMetadata } from '@nestjs/common';
import { TenantModules } from '../../modules/tenant/domain/entities/tenant.entity';

/**
 * Se deriva de `TenantModules` en vez de repetir la lista: un módulo nuevo queda
 * disponible para `@RequiresModule` sin tocar este archivo, y uno renombrado
 * rompe el build en vez de fallar callado en runtime.
 */
export type ModuleFlag = keyof TenantModules;

export const MODULE_FLAGS_KEY = 'moduleFlags';

export const RequiresModule = (...flags: ModuleFlag[]) =>
  SetMetadata(MODULE_FLAGS_KEY, flags);
