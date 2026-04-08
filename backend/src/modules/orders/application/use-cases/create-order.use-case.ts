import { BadRequestException, Inject, Injectable, Optional } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Order } from '../../domain/entities/order.entity';
import { OrderItem } from '../../domain/entities/order-item.entity';
import { OrderPayment } from '../../domain/entities/order-payment.entity';
import { OrderRepositoryPort } from '../../domain/ports/order-repository.port';
import { ProductRepositoryPort } from '../../../catalog/domain/ports/product-repository.port';
import { CashSessionRepositoryPort } from '../../../cash-session/domain/ports/cash-session-repository.port';
import { TenantRepositoryPort } from '../../../tenant/domain/ports/tenant-repository.port';
import { EventsService } from '../../../events/events.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { Customer } from '../../../customers/domain/entities/customer.entity';
import { CustomerRepositoryPort, CUSTOMER_REPOSITORY_PORT } from '../../../customers/domain/ports/customer-repository.port';
import { PaymentMethod } from '@pos/shared';

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject('OrderRepositoryPort')
    private readonly orderRepository: OrderRepositoryPort,

    @Inject('ProductRepositoryPort')
    private readonly productRepository: ProductRepositoryPort,

    @Inject('CashSessionRepositoryPort')
    private readonly cashSessionRepository: CashSessionRepositoryPort,

    @Inject('TenantRepositoryPort')
    private readonly tenantRepository: TenantRepositoryPort,

    @Optional() @Inject(CUSTOMER_REPOSITORY_PORT)
    private readonly customerRepository?: CustomerRepositoryPort,

    @Optional() private readonly eventsService?: EventsService,
  ) {}

  async execute(tenantId: string, branchId: string, userId: string, dto: CreateOrderDto): Promise<Order> {
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

    // 3. Resolve optional customer
    let resolvedCustomerId: string | null = null;

    if (this.customerRepository) {
      if (dto.customerId) {
        const customer = await this.customerRepository.findById(dto.customerId, tenantId);
        if (!customer) {
          throw new BadRequestException(`Cliente ${dto.customerId} no encontrado`);
        }
        resolvedCustomerId = customer.id;
      } else if (dto.createCustomer) {
        const phone = dto.createCustomer.phone?.trim() || null;
        let customer: Customer | null = null;

        if (phone) {
          customer = await this.customerRepository.findByPhone(phone, tenantId);
        }

        if (!customer) {
          const newCustomer = Customer.create({
            tenantId,
            name: dto.createCustomer.name,
            phone: phone ?? undefined,
            email: dto.createCustomer.email,
          });
          customer = await this.customerRepository.save(newCustomer);
        }

        resolvedCustomerId = customer.id;
      }
    }

    // 4. Require an open cash session if any payment uses CASH — only when the branch
    //    has previously used cash management (at least one session exists).
    const hasCashPayment = dto.payments.some((p) => p.method === PaymentMethod.CASH);
    if (hasCashPayment) {
      const anySessions = await this.cashSessionRepository.findByBranch(tenantId, branchId, 1);
      if (anySessions.length > 0) {
        const openSession = await this.cashSessionRepository.findOpenByBranch(tenantId, branchId);
        if (!openSession) {
          throw new BadRequestException('No hay una caja abierta. Abre la caja antes de registrar un pago en efectivo.');
        }
      }
    }

    // 5. Reserve the order number using the tenant's configured reset period
    const tenant = await this.tenantRepository.findById(tenantId);
    const resetPeriod = tenant?.orderNumberResetPeriod ?? 'DAILY';
    const orderNumber = await this.orderRepository.getNextOrderNumber(tenantId, branchId, new Date(), resetPeriod);

    // 6. Pre-generate the order id so items and payments can reference it
    const orderId = uuidv4();

    // 7. Build order items with product snapshot (name + price at time of order)
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

    // 8. Validate that payments sum matches the order total (tolerance ±0.01 for rounding)
    const subtotal = Math.round(items.reduce((sum, i) => sum + i.subtotal, 0) * 100) / 100;
    const paymentsSum = Math.round(dto.payments.reduce((sum, p) => sum + p.amount, 0) * 100) / 100;
    if (Math.abs(paymentsSum - subtotal) > 0.01) {
      throw new BadRequestException(
        `La suma de pagos (${paymentsSum}) no coincide con el total del pedido (${subtotal})`,
      );
    }

    // 9. Determine dominant payment method (highest amount; first wins on tie)
    const dominant = dto.payments.reduce((a, b) => (b.amount > a.amount ? b : a));

    // 10. Build OrderPayment entities
    const payments: OrderPayment[] = dto.payments.map(
      (p) =>
        new OrderPayment({
          id:       uuidv4(),
          orderId,
          tenantId,
          method:   p.method as PaymentMethod,
          amount:   p.amount,
        }),
    );

    // 11. Create the aggregate root (subtotal + total computed inside)
    const order = Order.create({
      id: orderId,
      tenantId,
      branchId,
      orderNumber,
      type:          dto.type,
      paymentMethod: dominant.method,
      payments,
      items,
      notes:      dto.notes ?? null,
      createdBy:  userId,
      customerId: resolvedCustomerId,
    });

    // 12. Persist and return
    const saved = await this.orderRepository.save(order);
    this.eventsService?.emitToTenant(tenantId, 'order.created', saved);
    return saved;
  }
}
