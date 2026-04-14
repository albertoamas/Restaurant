import { v4 as uuidv4 } from 'uuid';
import { OrderNumberResetPeriod, SaasPlan } from '@pos/shared';

export interface TenantModules {
  ordersEnabled: boolean;
  cashEnabled: boolean;
  teamEnabled: boolean;
  branchesEnabled: boolean;
  kitchenEnabled: boolean;
}

export interface TenantSettings {
  orderNumberResetPeriod: OrderNumberResetPeriod;
  logoUrl?: string | null;
  businessAddress?: string | null;
  businessPhone?: string | null;
  receiptSlogan?: string | null;
}

export class Tenant {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly plan: SaasPlan,
    public readonly ordersEnabled: boolean,
    public readonly cashEnabled: boolean,
    public readonly teamEnabled: boolean,
    public readonly branchesEnabled: boolean,
    public readonly kitchenEnabled: boolean,
    public readonly orderNumberResetPeriod: OrderNumberResetPeriod,
    public readonly logoUrl: string | null = null,
    public readonly businessAddress: string | null = null,
    public readonly businessPhone: string | null = null,
    public readonly receiptSlogan: string | null = null,
  ) {}

  static create(name: string, slug: string): Tenant {
    // New tenants start inactive — admin must activate after payment
    return new Tenant(
      uuidv4(), name, slug, false, new Date(),
      SaasPlan.BASICO,
      true, true, true, true, false,
      OrderNumberResetPeriod.DAILY,
      null, null, null, null,
    );
  }

  withActive(isActive: boolean): Tenant {
    return new Tenant(
      this.id, this.name, this.slug, isActive, this.createdAt,
      this.plan,
      this.ordersEnabled, this.cashEnabled, this.teamEnabled,
      this.branchesEnabled, this.kitchenEnabled,
      this.orderNumberResetPeriod, this.logoUrl,
      this.businessAddress, this.businessPhone, this.receiptSlogan,
    );
  }

  withPlan(plan: SaasPlan): Tenant {
    return new Tenant(
      this.id, this.name, this.slug, this.isActive, this.createdAt,
      plan,
      this.ordersEnabled, this.cashEnabled, this.teamEnabled,
      this.branchesEnabled, this.kitchenEnabled,
      this.orderNumberResetPeriod, this.logoUrl,
      this.businessAddress, this.businessPhone, this.receiptSlogan,
    );
  }

  withModules(modules: Partial<TenantModules>): Tenant {
    return new Tenant(
      this.id, this.name, this.slug, this.isActive, this.createdAt,
      this.plan,
      modules.ordersEnabled   ?? this.ordersEnabled,
      modules.cashEnabled     ?? this.cashEnabled,
      modules.teamEnabled     ?? this.teamEnabled,
      modules.branchesEnabled ?? this.branchesEnabled,
      modules.kitchenEnabled  ?? this.kitchenEnabled,
      this.orderNumberResetPeriod, this.logoUrl,
      this.businessAddress, this.businessPhone, this.receiptSlogan,
    );
  }

  withSettings(settings: Partial<TenantSettings>): Tenant {
    return new Tenant(
      this.id, this.name, this.slug, this.isActive, this.createdAt,
      this.plan,
      this.ordersEnabled, this.cashEnabled, this.teamEnabled,
      this.branchesEnabled, this.kitchenEnabled,
      settings.orderNumberResetPeriod ?? this.orderNumberResetPeriod,
      settings.logoUrl          !== undefined ? (settings.logoUrl          ?? null) : this.logoUrl,
      settings.businessAddress  !== undefined ? (settings.businessAddress  ?? null) : this.businessAddress,
      settings.businessPhone    !== undefined ? (settings.businessPhone    ?? null) : this.businessPhone,
      settings.receiptSlogan    !== undefined ? (settings.receiptSlogan    ?? null) : this.receiptSlogan,
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

  get settings(): TenantSettings {
    return {
      orderNumberResetPeriod: this.orderNumberResetPeriod,
      logoUrl:         this.logoUrl,
      businessAddress: this.businessAddress,
      businessPhone:   this.businessPhone,
      receiptSlogan:   this.receiptSlogan,
    };
  }
}
