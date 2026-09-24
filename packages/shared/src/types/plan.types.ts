import { SaasPlan } from './enums';

/** Convención de la BD: -1 significa "sin límite". Nunca comparar contra 999. */
export const UNLIMITED = -1;

export function isUnlimited(value: number): boolean {
  return value === UNLIMITED;
}

export interface PlanLimits {
  maxBranches:    number;  // -1 = unlimited
  maxCashiers:    number;
  maxProducts:    number;
  kitchenEnabled: boolean;
  rafflesEnabled: boolean;
  teamEnabled:    boolean;
  /** Habilita las pestañas de reporte más allá de Resumen y Ventas. */
  advancedReports: boolean;
  /** Días de historial de reportes consultables. -1 = sin límite. */
  reportHistoryDays: number;
  /** Cuota de imágenes en MB. -1 = sin límite. */
  maxStorageMb: number;
}

export interface PlanDto extends PlanLimits {
  id:          SaasPlan;
  displayName: string;
  priceBs:     number;
}
