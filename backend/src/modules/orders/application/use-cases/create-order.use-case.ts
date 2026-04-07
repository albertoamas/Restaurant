import { BadRequestException, Inject, Injectable, Optional } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Order } from '../../domain/entities/order.entity';
import { OrderItem } from '../../domain/entities/order-item.entity';
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

    // 4. Require an open cash session for CASH payments — only when the branch
    //    has previously used cash management (at least one session exists).
    //    Branches that have never opened a session are considered to not use
    //    the cash module, so no enforcement applies.
    if (dto.paymentMethod === PaymentMethod.CASH) {
      const anySessions = await this.cashSessionRepository.findByBranch(tenantId, branchId, 1);
      if (anySessions.length > 0) {
        const openSession = await this.cashSessionRepository.findOpenByBranch(tenantId, branchId);
        if (!openSession) {
          throw new BadRequestException('No hay una caja abierta. Abre la caja antes de registrar un pago en efectivo.');
        }
      }
    }

    // 6. Reserve the order number using the tenant's configured reset period
    const tenant = await this.tenantRepository.findById(tenantId);
    const resetPeriod = tenant?.orderNumberResetPeriod ?? 'DAILY';
    const orderNumber = await this.orderRepository.getNextOrderNumber(tenantId, branchId, new Date(), resetPeriod);

    // 7. Pre-generate the order id so items can reference it
    const orderId = uuidv4();

    // 8. Build order items with product snapshot (name + price at time of order)
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

    // 9. Create the aggregate root (subtotal + total computed inside)
    const order = Order.create({
      id: orderId,
      tenantId,
      branchId,
      orderNumber,
      type: dto.type,
      paymentMethod: dto.paymentMethod,
      items,
      notes: dto.notes ?? null,
      createdBy: userId,
      customerId: resolvedCustomerId,
    });

    // 10. Persist and return
    const saved = await this.orderRepository.save(order);
    this.eventsService?.emitToTenant(tenantId, 'order.created', saved);
    return saved;
  }
}
