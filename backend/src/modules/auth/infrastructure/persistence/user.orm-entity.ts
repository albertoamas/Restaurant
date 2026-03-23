import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { UserRole } from '@pos/shared';
import { TenantOrmEntity } from '../../../tenant/infrastructure/persistence/tenant.orm-entity';

@Entity('users')
@Unique(['tenant_id', 'email'])
export class UserOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenant_id: string;

  @Column()
  email: string;

  @Column({ name: 'password_hash' })
  password_hash: string;

  @Column()
  name: string;

  @Column({ type: 'varchar' })
  role: UserRole;

  @Column({ name: 'is_active', default: true })
  is_active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ManyToOne(() => TenantOrmEntity, { onDelete: 'CASCADE' })
  tenant: TenantOrmEntity;
}
