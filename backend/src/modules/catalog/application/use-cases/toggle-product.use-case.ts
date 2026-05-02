import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { ProductRepositoryPort, PRODUCT_REPOSITORY_PORT } from '../../domain/ports/product-repository.port';
import { Product } from '../../domain/entities/product.entity';
import { EventsService } from '../../../events/events.service';

@Injectable()
export class ToggleProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY_PORT)
    private readonly productRepository: ProductRepositoryPort,
    @Optional() private readonly eventsService?: EventsService,
  ) {}

  async execute(id: string, tenantId: string): Promise<Product> {
    const product = await this.productRepository.findById(id, tenantId);
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    // Nota: no se verifica si el producto está en uso en un sorteo ACTIVE/DRAWING
    // porque CatalogModule ya es dependencia de RafflesModule — importarlo aquí crearía
    // una dependencia circular. Limitación arquitectónica conocida y documentada en CLAUDE.md.
    product.isActive = !product.isActive;

    const saved = await this.productRepository.save(product);
    this.eventsService?.emitToTenant(tenantId, 'product.updated', saved);
    return saved;
  }
}
