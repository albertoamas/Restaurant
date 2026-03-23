import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('tenants')
export class TenantOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ default: true })
  isActive: boolean;

  @Column()
  createdAt: Date;
}
