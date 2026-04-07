import { v4 as uuidv4 } from 'uuid';

export interface TenantModules {
  ordersEnabled: boolean;
  cashEnabled: boolean;
  teamEnabled: boolean;
  branchesEnabled: boolean;
  kitchenEnabled: boolean;
}

export class Tenant {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly ordersEnabled: boolean,
    public readonly cashEnabled: boolean,
    public readonly teamEnabled: boolean,
    public readonly branchesEnabled: boolean,
    public readonly kitchenEnabled: boolean,
  ) {}

  static create(name: string, slug: string): Tenant {
    // New tenants start inactive — admin must activate after payment
    return new Tenant(uuidv4(), name, slug, false, new Date(), true, true, true, true, false);
  }

  withActive(isActive: boolean): Tenant {
    return new Tenant(
      this.id, this.name, this.slug, isActive, this.createdAt,
      this.ordersEnabled, this.cashEnabled, this.teamEnabled,
      this.branchesEnabled, this.kitchenEnabled,
    );
  }

  withModules(modules: Partial<TenantModules>): Tenant {
    return new Tenant(
      this.id, this.name, this.slug, this.isActive, this.createdAt,
      modules.ordersEnabled   ?? this.ordersEnabled,
      modules.cashEnabled     ?? this.cashEnabled,
      modules.teamEnabled     ?? this.teamEnabled,
      modules.branchesEnabled ?? this.branchesEnabled,
      modules.kitchenEnabled  ?? this.kitchenEnabled,
    );
  }

  get modules(): TenantModules {
    return {
      ordersEnabled:   this.ordersEnabled,
      cashEnabled:     this.cashEnabled,
      teamEnabled:     this.teamEnabled,
      branchesEnabled: this.branchesEnabled,
      kitchenEnabled:  this.kitchenEnabled,
    };
  }
}
