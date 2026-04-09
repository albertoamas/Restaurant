import { SaasPlan, PlanLimits } from '@pos/shared';

export class Plan {
  constructor(
    public readonly id:             SaasPlan,
    public readonly displayName:    string,
    public readonly priceBs:        number,
    public readonly maxBranches:    number,
    public readonly maxCashiers:    number,
    public readonly maxProducts:    number,
    public readonly kitchenEnabled: boolean,
  ) {}

  get limits(): PlanLimits {
    return {
      maxBranches:    this.maxBranches,
      maxCashiers:    this.maxCashiers,
      maxProducts:    this.maxProducts,
      kitchenEnabled: this.kitchenEnabled,
    };
  }

  withUpdates(updates: {
    displayName?:    string;
    priceBs?:        number;
    maxBranches?:    number;
    maxCashiers?:    number;
    maxProducts?:    number;
    kitchenEnabled?: boolean;
  }): Plan {
    return new Plan(
      this.id,
      updates.displayName    ?? this.displayName,
      updates.priceBs        ?? this.priceBs,
      updates.maxBranches    ?? this.maxBranches,
      updates.maxCashiers    ?? this.maxCashiers,
      updates.maxProducts    ?? this.maxProducts,
      updates.kitchenEnabled ?? this.kitchenEnabled,
    );
  }
}
