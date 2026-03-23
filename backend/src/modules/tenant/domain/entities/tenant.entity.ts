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
    return new Tenant(uuidv4(), name, slug, true, new Date());
  }
}
