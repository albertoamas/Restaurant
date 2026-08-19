import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PaymentMethod, UserRole, SOCKET_EVENTS, OrderStatus } from '@pos/shared';
import { Order } from '../../domain/entities/order.entity';
import { OrderItem } from '../../domain/entities/order-item.entity';
import { OrderRepositoryPort } from '../../domain/ports/order-repository.port';
import { ProductRepositoryPort } from '../../../catalog/domain/ports/product-repository.port';
import { CashSessionRepositoryPort } from '../../../cash-session/domain/ports/cash-session-repository.port';
import { EventsService } from '../../../events/events.service';
import { AddOrderItemsDto } from '../dto/add-order-items.dto';

@Injectable()
export class AddOrderItemsUseCase {
  constructor(
    @Inject('OrderRepositoryPort')
    private readonly orderRepository: OrderRepositoryPort,

    @Inject('ProductRepositoryPort')
    private readonly productRepository: ProductRepositoryPort,

    @Inject('CashSessionRepositoryPort')
    private readonly cashSessionRepository: CashSessionRepositoryPort,

    @Optional() private readonly eventsService?: EventsService,
  ) {}

  async execute(
    tenantId: string,
    orderId: string,
    role: UserRole,
    dto: AddOrderItemsDto,
  ): Promise<Order> {
    // 1. Load order
    const order = await this.orderRepository.findById(orderId, tenantId);
    if (!order) {
      throw new NotFoundException(`Pedido ${orderId} no encontrado`);
    }

    // 2. Only active orders can receive new items
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('No se pueden añadir productos a un pedido cancelado');
    }
    if (order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('No se pueden añadir productos a un pedido ya entregado');
    }

    // 3. Validate and resolve products (price snapshot)
    const productIds = [...new Set(dto.items.map((i) => i.productId))];
    const products   = await this.productRepository.findByIds(productIds, tenantId);

    if (products.length !== productIds.length) {
      const foundIds  = new Set(products.map((p) => p.id));
      const missing   = productIds.filter((id) => !foundIds.has(id));
      throw new BadRequestException(
        `Los siguientes productos no existen o no pertenecen a este tenant: ${missing.join(', ')}`,
      );
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // 4. Build incoming OrderItem entities with price snapshot
    const incomingItems: OrderItem[] = dto.items.map((itemDto) => {
      const product = productMap.get(itemDto.productId)!;
      return OrderItem.create({
        orderId: order.id,
        productId:   product.id,
        productName: product.name,
        quantity:    itemDto.quantity,
        unitPrice:   product.price,
      });
    });

    // 5. Merge into order aggregate — increments qty if product already present
    const originalTotal = order.total;
    order.addItems(incomingItems);           // mutates order.items, order.total
    const newTotal    = order.total;
    const difference  = Math.round((newTotal - originalTotal) * 100) / 100;

    // 6. Payment handling depends on whether the order is already paid
    let paymentRecord: { id: string; method: PaymentMethod; amount: number } | undefined;
    let newDominantMethod: PaymentMethod | undefined;

    if (order.isPaid) {
      // The order was already paid — require a payment for the difference
      if (!dto.payment) {
        throw new BadRequestException(
          `Este pedido ya fue cobrado. Debes registrar el pago de la diferencia (Bs ${difference.toFixed(2)}).`,
        );
      }

      const paymentAmount = Math.round(dto.payment.amount * 100) / 100;
      if (Math.abs(paymentAmount - difference) > 0.01) {
        throw new BadRequestException(
          `El monto del pago (${paymentAmount}) no coincide con la diferencia del pedido (${difference.toFixed(2)})`,
        );
      }

      // CORTESIA can only be used by OWNER
      if (dto.payment.method === PaymentMethod.CORTESIA && role !== UserRole.OWNER) {
        throw new ForbiddenException('Solo el propietario puede registrar pagos de cortesía');
      }

      // Validate open cash session if paying with CASH
      if (dto.payment.method === PaymentMethod.CASH) {
        const anySessions = await this.cashSessionRepository.findByBranch(tenantId, order.branchId, 1);
        if (anySessions.length > 0) {
          const openSession = await this.cashSessionRepository.findOpenByBranch(tenantId, order.branchId);
          if (!openSession) {
            throw new BadRequestException('No hay una caja abierta. Abre la caja antes de registrar un pago en efectivo.');
          }
        }
      }

      paymentRecord = {
        id:     uuidv4(),
        method: dto.payment.method as PaymentMethod,
        amount: paymentAmount,
      };

      // Recalculate dominant method across all payments (original + new)
      const allPayments = [
        ...order.payments.map((p) => ({ method: p.method, amount: p.amount })),
        { method: paymentRecord.method, amount: paymentRecord.amount },
      ];
      const dominant = allPayments.reduce((a, b) => (b.amount > a.amount ? b : a));
      newDominantMethod = dominant.method as PaymentMethod;
    }
    // If not paid: no extra payment needed — will be collected later via registerPayments

    // 7. Persist changes in a single transaction
    const saved = await this.orderRepository.addItems(
      order.id,
      tenantId,
      order.items,          // already merged by addItems()
      newTotal,
      paymentRecord,
      newDominantMethod,
    );

    // 8. Notify connected clients (kitchen will update automatically)
    this.eventsService?.emitToTenant(tenantId, SOCKET_EVENTS.ORDER_UPDATED, saved);

    return saved;
  }
}
