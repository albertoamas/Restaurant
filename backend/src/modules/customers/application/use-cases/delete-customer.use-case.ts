import { ConflictException, Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { OrderStatus, SOCKET_EVENTS } from '@pos/shared';
import { CustomerRepositoryPort, CUSTOMER_REPOSITORY_PORT } from '../../domain/ports/customer-repository.port';
import { EventsService } from '../../../events/events.service';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class DeleteCustomerUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY_PORT)
    private readonly repo: CustomerRepositoryPort,
    private readonly prisma: PrismaService,
    @Optional() private readonly eventsService?: EventsService,
  ) {}

  async execute(id: string, tenantId: string): Promise<void> {
    const customer = await this.repo.findById(id, tenantId);
    if (!customer) throw new NotFoundException('Cliente no encontrado');

    // Prevent deletion if customer has active orders
    const activeOrders = await this.prisma.order.count({
      where: {
        customerId: id,
        tenantId,
        status: { in: [OrderStatus.PENDING, OrderStatus.PREPARING] },
      },
    });
    if (activeOrders > 0) {
      throw new ConflictException(
        `No se puede eliminar el cliente porque tiene ${activeOrders} pedido(s) activo(s).`,
      );
    }

    // Borrarlo arrastra sus tickets y su registro como ganador: se perdería el historial del sorteo.
    if (await this.repo.isInvolvedInRaffles(id, tenantId)) {
      throw new ConflictException(
        'No se puede eliminar el cliente porque participa en un sorteo sin terminar o figura como ganador.',
      );
    }

    await this.repo.delete(id, tenantId);
    this.eventsService?.emitToTenant(tenantId, SOCKET_EVENTS.CUSTOMER_DELETED, { id });
  }
}
