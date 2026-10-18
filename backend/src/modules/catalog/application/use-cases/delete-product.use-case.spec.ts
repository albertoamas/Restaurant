import { ConflictException, NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { SOCKET_EVENTS } from '@pos/shared';
import { DeleteProductUseCase } from './delete-product.use-case';
import { ProductRepositoryPort } from '../../domain/ports/product-repository.port';
import { Product } from '../../domain/entities/product.entity';
import { EventsService } from '../../../events/events.service';

const TENANT_ID = 'tenant-1';

function makeProduct(): Product {
  return Product.reconstitute({
    id: 'prod-1', tenantId: TENANT_ID, categoryId: 'cat-1', name: 'Café', price: 10,
    imageUrl: null, isActive: true, createdAt: new Date(),
  });
}

describe('DeleteProductUseCase', () => {
  let useCase: DeleteProductUseCase;
  let repo: MockProxy<ProductRepositoryPort>;
  let events: MockProxy<EventsService>;

  beforeEach(() => {
    repo    = mock<ProductRepositoryPort>();
    events  = mock<EventsService>();
    useCase = new DeleteProductUseCase(repo, events);

    repo.findById.mockResolvedValue(makeProduct());
    repo.isUsedByRaffle.mockResolvedValue(false);
    repo.delete.mockResolvedValue();
  });

  it('lanza NotFoundException si el producto no existe', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.execute('prod-1', TENANT_ID)).rejects.toThrow(NotFoundException);
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('no elimina un producto que usa un sorteo y sugiere desactivarlo', async () => {
    repo.isUsedByRaffle.mockResolvedValue(true);

    await expect(useCase.execute('prod-1', TENANT_ID)).rejects.toThrow(ConflictException);
    await expect(useCase.execute('prod-1', TENANT_ID)).rejects.toThrow('Desactívalo');
    expect(repo.isUsedByRaffle).toHaveBeenCalledWith('prod-1', TENANT_ID);
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('elimina el producto y avisa por socket cuando ningún sorteo lo usa', async () => {
    await useCase.execute('prod-1', TENANT_ID);

    expect(repo.delete).toHaveBeenCalledWith('prod-1', TENANT_ID);
    expect(events.emitToTenant).toHaveBeenCalledWith(TENANT_ID, SOCKET_EVENTS.PRODUCT_DELETED, { id: 'prod-1' });
  });
});
