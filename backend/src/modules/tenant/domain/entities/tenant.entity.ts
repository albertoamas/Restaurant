import { v4 as uuidv4 } from 'uuid';

export class Tenant {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
  ) {}

  static create(name: string, slug: string): Tenant {
    // New tenants start inactive — admin must activate after payment
    return new Tenant(uuidv4(), name, slug, false, new Date());
  }

  withActive(isActive: boolean): Tenant {
    return new Tenant(this.id, this.name, this.slug, isActive, this.createdAt);
  }
}
