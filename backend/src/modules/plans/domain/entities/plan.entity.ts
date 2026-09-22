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
  constructor(
    public readonly id:                SaasPlan,
    public readonly displayName:       string,
    public readonly priceBs:           number,
    public readonly maxBranches:       number,
    public readonly maxCashiers:       number,
    public readonly maxProducts:       number,
    public readonly kitchenEnabled:    boolean,
    public readonly rafflesEnabled:    boolean = false,
    public readonly teamEnabled:       boolean = true,
    public readonly advancedReports:   boolean = false,
    public readonly reportHistoryDays: number  = -1,
    public readonly maxStorageMb:      number  = -1,
  ) {}

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

  toDto(): PlanDto {
    return {
      id:          this.id,
      displayName: this.displayName,
      priceBs:     this.priceBs,
      ...this.limits,
    };
  }

  withUpdates(updates: Partial<PlanProps>): Plan {
    return new Plan(
      this.id,
      updates.displayName       ?? this.displayName,
      updates.priceBs           ?? this.priceBs,
      updates.maxBranches       ?? this.maxBranches,
      updates.maxCashiers       ?? this.maxCashiers,
      updates.maxProducts       ?? this.maxProducts,
      updates.kitchenEnabled    ?? this.kitchenEnabled,
      updates.rafflesEnabled    ?? this.rafflesEnabled,
      updates.teamEnabled       ?? this.teamEnabled,
      updates.advancedReports   ?? this.advancedReports,
      updates.reportHistoryDays ?? this.reportHistoryDays,
      updates.maxStorageMb      ?? this.maxStorageMb,
    );
  }
}
