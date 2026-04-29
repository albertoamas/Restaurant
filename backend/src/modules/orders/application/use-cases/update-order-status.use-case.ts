import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { OrderStatus } from '@pos/shared';
import { Order } from '../../domain/entities/order.entity';
import { OrderRepositoryPort } from '../../domain/ports/order-repository.port';
import { EventsService } from '../../../events/events.service';
import { RaffleAutoTicketService } from '../../../raffles/application/services/raffle-auto-ticket.service';

@Injectable()
export class UpdateOrderStatusUseCase {
  private readonly logger = new Logger(UpdateOrderStatusUseCase.name);

  constructor(
    @Inject('OrderRepositoryPort')
    private readonly orderRepository: OrderRepositoryPort,
    @Optional() private readonly eventsService?: EventsService,
    @Optional() private readonly raffleAutoTicket?: RaffleAutoTicketService,
  ) {}

  async execute(id: string, tenantId: string, newStatus: OrderStatus): Promise<Order> {
    const order = await this.orderRepository.findById(id, tenantId);

    if (!order) {
      throw new NotFoundException(`Order with id '${id}' not found`);
    }

    try {
      order.updateStatus(newStatus);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }

    const saved = await this.orderRepository.save(order);
    this.eventsService?.emitToTenant(tenantId, 'order.updated', saved);

    if (newStatus === OrderStatus.CANCELLED && this.raffleAutoTicket) {
      await this.raffleAutoTicket.cancelOrderTickets(tenantId, id, {
        customerId: order.customerId ?? undefined,
        orderTotal: order.total,
      }).catch((err) => this.logger.error(`cancelOrderTickets failed orderId=${id} tenantId=${tenantId}`, err?.stack));
    }

    return saved;
  }
}
