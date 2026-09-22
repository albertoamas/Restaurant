import { v4 as uuidv4 } from 'uuid';
import { OrderNumberResetPeriod, SaasPlan } from '@pos/shared';

export interface TenantModules {
  ordersEnabled: boolean;
  cashEnabled: boolean;
  teamEnabled: boolean;
  branchesEnabled: boolean;
  kitchenEnabled: boolean;
  rafflesEnabled: boolean;
}

export interface TenantSettings {
  orderNumberResetPeriod: OrderNumberResetPeriod;
  businessAddress?: string | null;
  businessPhone?: string | null;
  receiptSlogan?: string | null;
}

/** Campos mutables por los `with*`. El id y la fecha de alta nunca cambian. */
interface TenantState {
  name: string;
  slug: string;
  isActive: boolean;
  plan: SaasPlan;
  modules: TenantModules;
  moduleOverrides: Partial<TenantModules> | null;
  orderNumberResetPeriod: OrderNumberResetPeriod;
  businessAddress: string | null;
  businessPhone: string | null;
  receiptSlogan: string | null;
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
    public readonly rafflesEnabled: boolean,
    public readonly orderNumberResetPeriod: OrderNumberResetPeriod,
    public readonly businessAddress: string | null = null,
    public readonly businessPhone: string | null = null,
    public readonly receiptSlogan: string | null = null,
    /**
     * Solo los módulos que el admin fijó a mano como excepción al plan. Las
     * propiedades de arriba siguen siendo el valor efectivo; esto registra
     * cuáles fueron una decisión explícita, para que sobrevivan a un cambio
     * de plan. Ver `PlanModulesService`.
     */
    public readonly moduleOverrides: Partial<TenantModules> | null = null,
  ) {}

  /**
   * Un tenant nuevo nace con los módulos que le da su plan, no con constantes
   * fijas: quien llama resuelve `modules` con `PlanModulesService` (la entidad
   * es dominio puro y no puede inyectar servicios).
   */
  static create(name: string, slug: string, modules: TenantModules, plan = SaasPlan.BASICO): Tenant {
    return new Tenant(
      uuidv4(), name, slug, false, new Date(),
      plan,
      modules.ordersEnabled,
      modules.cashEnabled,
      modules.teamEnabled,
      modules.branchesEnabled,
      modules.kitchenEnabled,
      modules.rafflesEnabled,
      OrderNumberResetPeriod.DAILY,
      null, null, null,
      null,
    );
  }

  /** Un solo lugar donde se reconstruye la instancia: evita repetir 17 argumentos. */
  private copyWith(changes: Partial<TenantState>): Tenant {
    const modules = changes.modules ?? this.modules;
    return new Tenant(
      this.id,
      changes.name     ?? this.name,
      changes.slug     ?? this.slug,
      changes.isActive ?? this.isActive,
      this.createdAt,
      changes.plan     ?? this.plan,
      modules.ordersEnabled,
      modules.cashEnabled,
      modules.teamEnabled,
      modules.branchesEnabled,
      modules.kitchenEnabled,
      modules.rafflesEnabled,
      changes.orderNumberResetPeriod ?? this.orderNumberResetPeriod,
      changes.businessAddress !== undefined ? changes.businessAddress : this.businessAddress,
      changes.businessPhone   !== undefined ? changes.businessPhone   : this.businessPhone,
      changes.receiptSlogan   !== undefined ? changes.receiptSlogan   : this.receiptSlogan,
      changes.moduleOverrides !== undefined ? changes.moduleOverrides : this.moduleOverrides,
    );
  }

  withActive(isActive: boolean): Tenant {
    return this.copyWith({ isActive });
  }

  withPlan(plan: SaasPlan): Tenant {
    return this.copyWith({ plan });
  }

  withModules(modules: Partial<TenantModules>): Tenant {
    return this.copyWith({ modules: { ...this.modules, ...modules } });
  }

  /** Reemplaza el conjunto de excepciones del admin (no lo fusiona). */
  withModuleOverrides(moduleOverrides: Partial<TenantModules> | null): Tenant {
    return this.copyWith({ moduleOverrides });
  }

  withSettings(settings: Partial<TenantSettings>): Tenant {
    return this.copyWith({
      orderNumberResetPeriod: settings.orderNumberResetPeriod ?? this.orderNumberResetPeriod,
      businessAddress: settings.businessAddress !== undefined ? (settings.businessAddress ?? null) : undefined,
      businessPhone:   settings.businessPhone   !== undefined ? (settings.businessPhone   ?? null) : undefined,
      receiptSlogan:   settings.receiptSlogan   !== undefined ? (settings.receiptSlogan   ?? null) : undefined,
    });
  }

  get modules(): TenantModules {
    return {
      ordersEnabled:   this.ordersEnabled,
      cashEnabled:     this.cashEnabled,
      teamEnabled:     this.teamEnabled,
      branchesEnabled: this.branchesEnabled,
      kitchenEnabled:  this.kitchenEnabled,
      rafflesEnabled:  this.rafflesEnabled,
    };
  }

  get settings(): TenantSettings {
    return {
      orderNumberResetPeriod: this.orderNumberResetPeriod,
      businessAddress: this.businessAddress,
      businessPhone:   this.businessPhone,
      receiptSlogan:   this.receiptSlogan,
    };
  }
}
