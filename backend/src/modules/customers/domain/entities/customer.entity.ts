import { v4 as uuidv4 } from 'uuid';

export interface CustomerProps {
  id: string;
  tenantId: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type CreateCustomerProps = {
  tenantId: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
};

export class Customer {
  readonly id: string;
  readonly tenantId: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  readonly createdAt: Date;
  updatedAt: Date;

  private constructor(props: CustomerProps) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.name = props.name;
    this.phone = props.phone;
    this.email = props.email;
    this.notes = props.notes;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(props: CreateCustomerProps): Customer {
    const now = new Date();
    return new Customer({
      id: uuidv4(),
      tenantId: props.tenantId,
      name: props.name.trim(),
      phone: props.phone?.trim() || null,
      email: props.email?.trim() || null,
      notes: props.notes?.trim() || null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: CustomerProps): Customer {
    return new Customer(props);
  }

  update(patch: Partial<Pick<CustomerProps, 'name' | 'phone' | 'email' | 'notes'>>): void {
    if (patch.name !== undefined) this.name = patch.name.trim();
    if (patch.phone !== undefined) this.phone = patch.phone?.trim() || null;
    if (patch.email !== undefined) this.email = patch.email?.trim() || null;
    if (patch.notes !== undefined) this.notes = patch.notes?.trim() || null;
    this.updatedAt = new Date();
  }
}
