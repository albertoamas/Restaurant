import { v4 as uuidv4 } from 'uuid';

export interface BranchProps {
  id: string;
  tenantId: string;
  name: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
}

export class Branch {
  readonly id: string;
  readonly tenantId: string;
  name: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
  readonly createdAt: Date;

  private constructor(props: BranchProps) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.name = props.name;
    this.address = props.address;
    this.phone = props.phone;
    this.isActive = props.isActive;
    this.createdAt = props.createdAt;
  }

  static create(props: {
    tenantId: string;
    name: string;
    address?: string | null;
    phone?: string | null;
  }): Branch {
    return new Branch({
      id: uuidv4(),
      tenantId: props.tenantId,
      name: props.name,
      address: props.address ?? null,
      phone: props.phone ?? null,
      isActive: true,
      createdAt: new Date(),
    });
  }

  static reconstitute(props: BranchProps): Branch {
    return new Branch(props);
  }
}
