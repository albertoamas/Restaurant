import { ConflictException, Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { SOCKET_EVENTS } from '@pos/shared';
import { ProductRepositoryPort, PRODUCT_REPOSITORY_PORT } from '../../domain/ports/product-repository.port';
import { EventsService } from '../../../events/events.service';

@Injectable()
export class DeleteProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY_PORT)
    private readonly repo: ProductRepositoryPort,
    @Optional() private readonly eventsService?: EventsService,
  ) {}

  async execute(id: string, tenantId: string): Promise<void> {
    const product = await this.repo.findById(id, tenantId);
    if (!product) throw new NotFoundException('Producto no encontrado');

    // Al borrarlo, el sorteo quedaría sin producto y dejaría de dar tickets sin avisar.
    if (await this.repo.isUsedByRaffle(id, tenantId)) {
      throw new ConflictException(
        'No se puede eliminar el producto porque se usa en un sorteo. Desactívalo para que deje de venderse.',
      );
    }

    await this.repo.delete(id, tenantId);
    this.eventsService?.emitToTenant(tenantId, SOCKET_EVENTS.PRODUCT_DELETED, { id });
  }
}
