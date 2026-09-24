import { v4 as uuidv4 } from 'uuid';
import { OrderNumberResetPeriod, SaasPlan } from '@pos/shared';

export interface TenantModules {
  ordersEnabled: boolean;
  cashEnabled: boolean;
  teamEnabled: boolean;
  branchesEnabled: boolean;
  kitchenEnabled: boolean;
  rafflesEnabled: boolean;
  advancedReportsEnabled: boolean;
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
  /** Valor efectivo de cada módulo. Lo leen `ModuleGuard` y el mapeo a Prisma. */
  readonly ordersEnabled: boolean;
  readonly cashEnabled: boolean;
  readonly teamEnabled: boolean;
  readonly branchesEnabled: boolean;
  readonly kitchenEnabled: boolean;
  readonly rafflesEnabled: boolean;
  readonly advancedReportsEnabled: boolean;

  /**
   * Los módulos entran como un solo objeto y no como N booleanos sueltos: así
   * agregar uno no obliga a tocar cada sitio que construye un Tenant, ni deja
   * llamadas con seis booleanos seguidos donde el orden es invisible.
   */
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly plan: SaasPlan,
    modules: TenantModules,
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
  ) {
    this.ordersEnabled          = modules.ordersEnabled;
    this.cashEnabled            = modules.cashEnabled;
    this.teamEnabled            = modules.teamEnabled;
    this.branchesEnabled        = modules.branchesEnabled;
    this.kitchenEnabled         = modules.kitchenEnabled;
    this.rafflesEnabled         = modules.rafflesEnabled;
    this.advancedReportsEnabled = modules.advancedReportsEnabled;
  }

  /**
   * Un tenant nuevo nace con los módulos que le da su plan, no con constantes
   * fijas: quien llama resuelve `modules` con `PlanModulesService` (la entidad
   * es dominio puro y no puede inyectar servicios).
   */
  static create(name: string, slug: string, modules: TenantModules, plan = SaasPlan.BASICO): Tenant {
    return new Tenant(
      uuidv4(), name, slug, false, new Date(),
      plan,
      modules,
      OrderNumberResetPeriod.DAILY,
      null, null, null,
      null,
    );
  }

  /**
   * Reconstruye un tenant desde datos ya persistidos, por nombre en vez de por
   * posición. Mismo patrón que `Branch.reconstitute`: agregar un módulo nuevo no
   * vuelve a romper cada sitio que construye un Tenant.
   */
  static reconstitute(props: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    createdAt: Date;
    plan: SaasPlan;
    modules: TenantModules;
    orderNumberResetPeriod: OrderNumberResetPeriod;
    businessAddress?: string | null;
    businessPhone?: string | null;
    receiptSlogan?: string | null;
    moduleOverrides?: Partial<TenantModules> | null;
  }): Tenant {
    return new Tenant(
      props.id, props.name, props.slug, props.isActive, props.createdAt, props.plan,
      props.modules,
      props.orderNumberResetPeriod,
      props.businessAddress ?? null,
      props.businessPhone   ?? null,
      props.receiptSlogan   ?? null,
      props.moduleOverrides ?? null,
    );
  }

  /** Un solo lugar donde se reconstruye la instancia: evita repetir 18 argumentos. */
  private copyWith(changes: Partial<TenantState>): Tenant {
    return new Tenant(
      this.id,
      changes.name     ?? this.name,
      changes.slug     ?? this.slug,
      changes.isActive ?? this.isActive,
      this.createdAt,
      changes.plan     ?? this.plan,
      changes.modules  ?? this.modules,
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
      advancedReportsEnabled: this.advancedReportsEnabled,
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
