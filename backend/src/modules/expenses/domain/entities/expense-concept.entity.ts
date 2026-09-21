import { randomUUID } from 'crypto';

interface ExpenseConceptProps {
  id: string;
  tenantId: string;
  categoryId: string;
  name: string;
  unit: string | null;
  defaultUnitPrice: number | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
}

export type ExpenseConceptChanges = Partial<
  Pick<ExpenseConceptProps, 'categoryId' | 'name' | 'unit' | 'defaultUnitPrice' | 'isActive' | 'sortOrder'>
>;

/**
 * Gasto predefinido reutilizable. Los ítems de gasto guardan su propio snapshot
 * de nombre/unidad/precio, así que editar un concepto nunca reescribe el historial.
 */
export class ExpenseConceptEntity {
  readonly id: string;
  readonly tenantId: string;
  readonly categoryId: string;
  readonly name: string;
  readonly unit: string | null;
  readonly defaultUnitPrice: number | null;
  readonly isActive: boolean;
  readonly sortOrder: number;
  readonly createdAt: Date;

  private constructor(props: ExpenseConceptProps) {
    this.id               = props.id;
    this.tenantId         = props.tenantId;
    this.categoryId       = props.categoryId;
    this.name             = props.name;
    this.unit             = props.unit;
    this.defaultUnitPrice = props.defaultUnitPrice;
    this.isActive         = props.isActive;
    this.sortOrder        = props.sortOrder;
    this.createdAt        = props.createdAt;
  }

  static create(
    props: Pick<ExpenseConceptProps, 'tenantId' | 'categoryId' | 'name' | 'unit' | 'defaultUnitPrice' | 'sortOrder'>,
  ): ExpenseConceptEntity {
    return new ExpenseConceptEntity({
      ...props,
      id:        randomUUID(),
      isActive:  true,
      createdAt: new Date(),
    });
  }

  static reconstitute(props: ExpenseConceptProps): ExpenseConceptEntity {
    return new ExpenseConceptEntity(props);
  }

  /** Devuelve una copia con los campos reemplazados — la entidad es inmutable. */
  withChanges(changes: ExpenseConceptChanges): ExpenseConceptEntity {
    return new ExpenseConceptEntity({
      id:               this.id,
      tenantId:         this.tenantId,
      createdAt:        this.createdAt,
      categoryId:       changes.categoryId ?? this.categoryId,
      name:             changes.name       ?? this.name,
      unit:             changes.unit             !== undefined ? changes.unit             : this.unit,
      defaultUnitPrice: changes.defaultUnitPrice !== undefined ? changes.defaultUnitPrice : this.defaultUnitPrice,
      isActive:         changes.isActive   ?? this.isActive,
      sortOrder:        changes.sortOrder  ?? this.sortOrder,
    });
  }
}
