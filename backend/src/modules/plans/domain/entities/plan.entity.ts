import { SaasPlan, PlanLimits, PlanDto } from '@pos/shared';

export interface PlanProps {
  displayName:       string;
  priceBs:           number;
  maxBranches:       number;
  maxCashiers:       number;
  maxProducts:       number;
  kitchenEnabled:    boolean;
  rafflesEnabled:    boolean;
  teamEnabled:       boolean;
  advancedReports:   boolean;
  reportHistoryDays: number;
  maxStorageMb:      number;
}

export class Plan {
  readonly displayName:       string;
  readonly priceBs:           number;
  readonly maxBranches:       number;
  readonly maxCashiers:       number;
  readonly maxProducts:       number;
  readonly kitchenEnabled:    boolean;
  readonly rafflesEnabled:    boolean;
  readonly teamEnabled:       boolean;
  readonly advancedReports:   boolean;
  readonly reportHistoryDays: number;
  readonly maxStorageMb:      number;

  /**
   * Los campos entran por nombre y no por posición: con once argumentos, cuatro
   * de ellos booleanos seguidos, una llamada posicional no se puede leer ni
   * revisar, y equivocarse de orden compila igual.
   */
  constructor(public readonly id: SaasPlan, props: PlanProps) {
    this.displayName       = props.displayName;
    this.priceBs           = props.priceBs;
    this.maxBranches       = props.maxBranches;
    this.maxCashiers       = props.maxCashiers;
    this.maxProducts       = props.maxProducts;
    this.kitchenEnabled    = props.kitchenEnabled;
    this.rafflesEnabled    = props.rafflesEnabled;
    this.teamEnabled       = props.teamEnabled;
    this.advancedReports   = props.advancedReports;
    this.reportHistoryDays = props.reportHistoryDays;
    this.maxStorageMb      = props.maxStorageMb;
  }

  get limits(): PlanLimits {
    return {
      maxBranches:       this.maxBranches,
      maxCashiers:       this.maxCashiers,
      maxProducts:       this.maxProducts,
      kitchenEnabled:    this.kitchenEnabled,
      rafflesEnabled:    this.rafflesEnabled,
      teamEnabled:       this.teamEnabled,
      advancedReports:   this.advancedReports,
      reportHistoryDays: this.reportHistoryDays,
      maxStorageMb:      this.maxStorageMb,
    };
  }

  /** Todos los campos editables, tal como los espera el constructor. */
  get props(): PlanProps {
    return { displayName: this.displayName, priceBs: this.priceBs, ...this.limits };
  }

  toDto(): PlanDto {
    return {
      id:          this.id,
      displayName: this.displayName,
      priceBs:     this.priceBs,
      ...this.limits,
    };
  }

  withUpdates(updates: Partial<PlanProps>): Plan {
    return new Plan(this.id, { ...this.props, ...stripUndefined(updates) });
  }
}

/**
 * `{ ...props, ...updates }` con una clave en `undefined` la pisaría con
 * `undefined`; un PATCH parcial llega justamente así.
 */
function stripUndefined(updates: Partial<PlanProps>): Partial<PlanProps> {
  return Object.fromEntries(
    Object.entries(updates).filter(([, value]) => value !== undefined),
  ) as Partial<PlanProps>;
}
