import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Order } from '../../domain/entities/order.entity';
import { OrderItem } from '../../domain/entities/order-item.entity';
import { OrderRepositoryPort } from '../../domain/ports/order-repository.port';
import { ProductRepositoryPort } from '../../../catalog/domain/ports/product-repository.port';
import { CreateOrderDto } from '../dto/create-order.dto';

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject('OrderRepositoryPort')
    private readonly orderRepository: OrderRepositoryPort,

    @Inject('ProductRepositoryPort')
    private readonly productRepository: ProductRepositoryPort,
  ) {}

  async execute(tenantId: string, userId: string, dto: CreateOrderDto): Promise<Order> {
    // 1. Collect requested product ids (deduplicated for the lookup)
    const productIds = [...new Set(dto.items.map((item) => item.productId))];

    // 2. Fetch and validate all products belong to the tenant
    const products = await this.productRepository.findByIds(productIds, tenantId);

    if (products.length !== productIds.length) {
      const foundIds = new Set(products.map((p) => p.id));
      const missingIds = productIds.filter((id) => !foundIds.has(id));
      throw new BadRequestException(
        `The following products were not found or do not belong to this tenant: ${missingIds.join(', ')}`,
      );
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // 3. Reserve the order number for today
    const orderNumber = await this.orderRepository.getNextOrderNumber(tenantId, new Date());

    // 4. Pre-generate the order id so items can reference it
    const orderId = uuidv4();

    // 5. Build order items with product snapshot (name + price at time of order)
    const items: OrderItem[] = dto.items.map((itemDto) => {
      const product = productMap.get(itemDto.productId)!;

      return OrderItem.create({
        orderId,
        productId: product.id,
        productName: product.name,
        quantity: itemDto.quantity,
        unitPrice: product.price,
      });
    });

    // 6. Create the aggregate root (subtotal + total computed inside)
    const order = Order.create({
      id: orderId,
      tenantId,
      orderNumber,
      type: dto.type,
      paymentMethod: dto.paymentMethod,
      items,
      notes: dto.notes ?? null,
      createdBy: userId,
    });

    // 7. Persist and return
    return this.orderRepository.save(order);
  }
}
