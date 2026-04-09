import { SaasPlan } from './enums';

export interface PlanLimits {
  maxBranches:    number;  // -1 = unlimited
  maxCashiers:    number;
  maxProducts:    number;
  kitchenEnabled: boolean;
}

export interface PlanDto {
  id:             SaasPlan;
  displayName:    string;
  priceBs:        number;
  maxBranches:    number;
  maxCashiers:    number;
  maxProducts:    number;
  kitchenEnabled: boolean;
}
