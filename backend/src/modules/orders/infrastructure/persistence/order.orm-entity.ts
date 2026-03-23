import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TenantOrmEntity } from '../../../tenant/infrastructure/persistence/tenant.orm-entity';
import { OrderItemOrmEntity } from './order-item.orm-entity';

@Entity('orders')
@Index(['tenant_id', 'created_at'])
@Index(['tenant_id', 'status'])
export class OrderOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenant_id: string;

  @Column({ name: 'order_number', type: 'integer' })
  order_number: number;

  @Column({ type: 'varchar' })
  type: string;

  @Column({ type: 'varchar' })
  status: string;

  @Column({ name: 'payment_method', type: 'varchar' })
  payment_method: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'created_by', type: 'uuid' })
  created_by: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @ManyToOne(() => TenantOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantOrmEntity;

  @OneToMany(() => OrderItemOrmEntity, (item) => item.order, {
    cascade: true,
    eager: true,
  })
  items: OrderItemOrmEntity[];
}
