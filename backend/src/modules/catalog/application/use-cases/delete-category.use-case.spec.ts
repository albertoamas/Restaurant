import { ConflictException, NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { SOCKET_EVENTS } from '@pos/shared';
import { DeleteCategoryUseCase } from './delete-category.use-case';
import { CategoryRepositoryPort } from '../../domain/ports/category-repository.port';
import { Category } from '../../domain/entities/category.entity';
import { EventsService } from '../../../events/events.service';

const TENANT_ID = 'tenant-1';

describe('DeleteCategoryUseCase', () => {
  let useCase: DeleteCategoryUseCase;
  let repo: MockProxy<CategoryRepositoryPort>;
  let events: MockProxy<EventsService>;

  beforeEach(() => {
    repo    = mock<CategoryRepositoryPort>();
    events  = mock<EventsService>();
    useCase = new DeleteCategoryUseCase(repo, events);

    repo.findById.mockResolvedValue(Category.reconstitute({ id: 'cat-1', tenantId: TENANT_ID, name: 'Bebidas', sortOrder: 0, isActive: true }));
    repo.isUsedByRaffle.mockResolvedValue(false);
    repo.delete.mockResolvedValue();
  });

  it('lanza NotFoundException si la categoría no existe', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.execute('cat-1', TENANT_ID)).rejects.toThrow(NotFoundException);
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('no elimina una categoría que usa un sorteo (o uno de sus productos)', async () => {
    repo.isUsedByRaffle.mockResolvedValue(true);

    await expect(useCase.execute('cat-1', TENANT_ID)).rejects.toThrow(ConflictException);
    await expect(useCase.execute('cat-1', TENANT_ID)).rejects.toThrow('Desactívala');
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('elimina la categoría y avisa por socket cuando ningún sorteo la usa', async () => {
    await useCase.execute('cat-1', TENANT_ID);

    expect(repo.delete).toHaveBeenCalledWith('cat-1', TENANT_ID);
    expect(events.emitToTenant).toHaveBeenCalledWith(TENANT_ID, SOCKET_EVENTS.CATEGORY_DELETED, { id: 'cat-1' });
  });
});
