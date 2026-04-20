import { SetMetadata } from '@nestjs/common';

export type ModuleFlag =
  | 'ordersEnabled'
  | 'cashEnabled'
  | 'teamEnabled'
  | 'branchesEnabled'
  | 'kitchenEnabled'
  | 'rafflesEnabled';

export const MODULE_FLAGS_KEY = 'moduleFlags';

export const RequiresModule = (...flags: ModuleFlag[]) =>
  SetMetadata(MODULE_FLAGS_KEY, flags);
