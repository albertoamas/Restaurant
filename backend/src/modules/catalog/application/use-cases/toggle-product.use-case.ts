import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { SOCKET_EVENTS } from '@pos/shared';
import { ProductRepositoryPort, PRODUCT_REPOSITORY_PORT } from '../../domain/ports/product-repository.port';
import { Product } from '../../domain/entities/product.entity';
import { EventsService } from '../../../events/events.service';
import { TenantRepositoryPort } from '../../../tenant/domain/ports/tenant-repository.port';
import { PlanLimitService } from '../../../plans/application/plan-limit.service';

@Injectable()
export class ToggleProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY_PORT)
    private readonly productRepository: ProductRepositoryPort,
    @Inject('TenantRepositoryPort')
    private readonly tenantRepository: TenantRepositoryPort,
    private readonly planLimitService: PlanLimitService,
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
    // Reactivar suma un producto activo, y el cupo del plan cuenta solo los
    // activos: sin este control, desactivar → crear otro → reactivar dejaría al
    // negocio por encima de su límite.
    if (!product.isActive) {
      const tenant = await this.tenantRepository.findById(tenantId);
      if (tenant) {
        const plan  = await this.planLimitService.getPlan(tenant.plan);
        const count = await this.productRepository.countByTenant(tenantId);
        this.planLimitService.assertWithinLimit('productos', plan, count);
      }
    }

    product.isActive = !product.isActive;

    const saved = await this.productRepository.save(product);
    this.eventsService?.emitToTenant(tenantId, SOCKET_EVENTS.PRODUCT_UPDATED, saved);
    return saved;
  }
}
