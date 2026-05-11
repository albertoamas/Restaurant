import { randomUUID } from 'crypto';

interface ExpenseCategoryProps {
  id: string;
  tenantId: string;
  name: string;
  icon: string | null;
  isActive: boolean;
  trackQuantity: boolean;
  sortOrder: number;
  createdAt: Date;
}

export class ExpenseCategoryEntity {
  readonly id: string;
  readonly tenantId: string;
  readonly name: string;
  readonly icon: string | null;
  readonly isActive: boolean;
  readonly trackQuantity: boolean;
  readonly sortOrder: number;
  readonly createdAt: Date;

  private constructor(props: ExpenseCategoryProps) {
    this.id            = props.id;
    this.tenantId      = props.tenantId;
    this.name          = props.name;
    this.icon          = props.icon;
    this.isActive      = props.isActive;
    this.trackQuantity = props.trackQuantity;
    this.sortOrder     = props.sortOrder;
    this.createdAt     = props.createdAt;
  }

  static create(
    props: Pick<ExpenseCategoryProps, 'tenantId' | 'name' | 'icon' | 'trackQuantity' | 'sortOrder'>,
  ): ExpenseCategoryEntity {
    return new ExpenseCategoryEntity({
      ...props,
      id:        randomUUID(),
      isActive:  true,
      createdAt: new Date(),
    });
  }

  static reconstitute(props: ExpenseCategoryProps): ExpenseCategoryEntity {
    return new ExpenseCategoryEntity(props);
  }
}
