import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
} from 'typeorm';
import { OrderOrmEntity } from './order.orm-entity';

@Entity('order_items')
export class OrderItemOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ name: 'order_id', type: 'uuid' })
  order_id: string;

  @Column({ name: 'product_id', type: 'uuid' })
  product_id: string;

  @Column({ name: 'product_name', type: 'varchar' })
  product_name: string;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unit_price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @ManyToOne(() => OrderOrmEntity, (order) => order.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order: OrderOrmEntity;
}
