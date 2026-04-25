import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PaymentMethod, UserRole } from '@pos/shared';
import { Order } from '../../domain/entities/order.entity';
import { OrderRepositoryPort } from '../../domain/ports/order-repository.port';
import { CashSessionRepositoryPort } from '../../../cash-session/domain/ports/cash-session-repository.port';
import { EventsService } from '../../../events/events.service';
import { RegisterOrderPaymentDto } from '../dto/register-order-payment.dto';
import { OrderStatus } from '@pos/shared';
import { RaffleAutoTicketService } from '../../../raffles/application/services/raffle-auto-ticket.service';

@Injectable()
export class RegisterOrderPaymentUseCase {
  constructor(
    @Inject('OrderRepositoryPort')
    private readonly orderRepository: OrderRepositoryPort,

    @Inject('CashSessionRepositoryPort')
    private readonly cashSessionRepository: CashSessionRepositoryPort,

    @Optional() private readonly eventsService?: EventsService,
    @Optional() private readonly raffleAutoTicket?: RaffleAutoTicketService,
  ) {}

  async execute(tenantId: string, orderId: string, role: UserRole, dto: RegisterOrderPaymentDto): Promise<Order> {
    // 1. Load order
    const order = await this.orderRepository.findById(orderId, tenantId);
    if (!order) {
      throw new NotFoundException(`Pedido ${orderId} no encontrado`);
    }

    // 2. Cannot pay a cancelled order
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('No se puede cobrar un pedido cancelado');
    }

    // 3. Already paid
    if (order.isPaid) {
      throw new BadRequestException('Este pedido ya fue cobrado');
    }

    // 4. Validate payments sum == order total (±0.01 tolerance)
    const paymentsSum = Math.round(dto.payments.reduce((sum, p) => sum + p.amount, 0) * 100) / 100;
    if (Math.abs(paymentsSum - order.total) > 0.01) {
      throw new BadRequestException(
        `La suma de pagos (${paymentsSum}) no coincide con el total del pedido (${order.total})`,
      );
    }

    const hasCortesia = dto.payments.some((p) => p.method === PaymentMethod.CORTESIA);
    if (hasCortesia && role !== UserRole.OWNER) {
      throw new ForbiddenException('Solo el propietario puede registrar pedidos de cortesía');
    }
    if (hasCortesia && dto.payments.length > 1) {
      throw new BadRequestException('Cortesía no puede combinarse con otros métodos de pago');
    }

    // Revoke any raffle tickets already assigned to this order (deferred-payment CORTESIA path)
    if (hasCortesia && this.raffleAutoTicket) {
      this.raffleAutoTicket.cancelOrderTickets(tenantId, orderId).catch(() => {});
    }

    // 5. Cash session check if any payment is CASH
    const hasCashPayment = dto.payments.some((p) => p.method === PaymentMethod.CASH);
    if (hasCashPayment) {
      const anySessions = await this.cashSessionRepository.findByBranch(tenantId, order.branchId, 1);
      if (anySessions.length > 0) {
        const openSession = await this.cashSessionRepository.findOpenByBranch(tenantId, order.branchId);
        if (!openSession) {
          throw new BadRequestException('No hay una caja abierta. Abre la caja antes de registrar un pago en efectivo.');
        }
      }
    }

    // 6. Determine dominant method (highest amount; first wins on tie)
    const dominant = dto.payments.reduce((a, b) => (b.amount > a.amount ? b : a));

    // 7. Build payment records with generated IDs
    const payments: { id: string; method: PaymentMethod; amount: number }[] = dto.payments.map((p) => ({
      id:     uuidv4(),
      method: p.method as PaymentMethod,
      amount: p.amount,
    }));

    // 8. Persist payments and update dominant method on the order
    const saved = await this.orderRepository.registerPayments(
      orderId,
      tenantId,
      payments,
      dominant.method as PaymentMethod,
    );

    // 9. Notify connected clients
    this.eventsService?.emitToTenant(tenantId, 'order.updated', saved);

    return saved;
  }
}
