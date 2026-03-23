import { v4 as uuidv4 } from 'uuid';

export interface CategoryProps {
  id: string;
  tenantId: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export class Category {
  readonly id: string;
  readonly tenantId: string;
  name: string;
  sortOrder: number;
  isActive: boolean;

  private constructor(props: CategoryProps) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.name = props.name;
    this.sortOrder = props.sortOrder;
    this.isActive = props.isActive;
  }

  static create(props: { tenantId: string; name: string; sortOrder?: number }): Category {
    return new Category({
      id: uuidv4(),
      tenantId: props.tenantId,
      name: props.name,
      sortOrder: props.sortOrder ?? 0,
      isActive: true,
    });
  }

  static reconstitute(props: CategoryProps): Category {
    return new Category(props);
  }
}
