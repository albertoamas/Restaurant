import { BadRequestException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { CreateRaffleUseCase } from './create-raffle.use-case';
import { RaffleRepositoryPort } from '../../domain/ports/raffle-repository.port';
import { CategoryRepositoryPort } from '../../../catalog/domain/ports/category-repository.port';
import { Category } from '../../../catalog/domain/entities/category.entity';
import { CreateRaffleDto } from '../dto/create-raffle.dto';

function makeCategory(id: string, name = 'Hamburguesas', isActive = true): Category {
  return Category.reconstitute({ id, tenantId: 'tenant-1', name, sortOrder: 0, isActive });
}

const DTO: CreateRaffleDto = {
  name: 'Sorteo Navidad',
  ticketMode: 'CATEGORY_MATCH',
  categoryIds: ['cat-1', 'cat-2'],
  numberOfWinners: 3,
  prizes: [
    { position: 1, prizeDescription: 'Celular' },
    { position: 2, prizeDescription: 'Televisor' },
    { position: 3, prizeDescription: 'Bicicleta' },
  ],
};

const SPENDING_DTO: CreateRaffleDto = {
  name: 'Sorteo Acumulativo',
  ticketMode: 'SPENDING_THRESHOLD',
  spendingThreshold: 100,
  numberOfWinners: 1,
  prizes: [{ position: 1, prizeDescription: 'Premio' }],
};

describe('CreateRaffleUseCase', () => {
  let useCase: CreateRaffleUseCase;
  let raffleRepo: MockProxy<RaffleRepositoryPort>;
  let categoryRepo: MockProxy<CategoryRepositoryPort>;

  beforeEach(() => {
    raffleRepo   = mock<RaffleRepositoryPort>();
    categoryRepo = mock<CategoryRepositoryPort>();
    useCase      = new CreateRaffleUseCase(raffleRepo, categoryRepo);

    categoryRepo.findByIds.mockResolvedValue([makeCategory('cat-1'), makeCategory('cat-2', 'Milanesas')]);
    raffleRepo.createRaffle.mockResolvedValue();
    raffleRepo.findRaffleWithTickets.mockResolvedValue({ id: 'r1', tickets: [], numberOfWinners: 3 } as never);
  });

  it('crea un sorteo por categorías con las categorías elegidas', async () => {
    const result = await useCase.execute('tenant-1', DTO);

    expect(categoryRepo.findByIds).toHaveBeenCalledWith(['cat-1', 'cat-2'], 'tenant-1');
    expect(raffleRepo.createRaffle).toHaveBeenCalledTimes(1);
    const saved = raffleRepo.createRaffle.mock.calls[0][0];
    expect(saved.ticketMode).toBe('CATEGORY_MATCH');
    expect(saved.categoryIds).toEqual(['cat-1', 'cat-2']);
    expect(saved.productId).toBeNull();
    expect(result).toBeDefined();
  });

  it('el sorteo guardado tiene el numberOfWinners y los premios correctos', async () => {
    await useCase.execute('tenant-1', DTO);

    const saved = raffleRepo.createRaffle.mock.calls[0][0];
    expect(saved.numberOfWinners).toBe(3);
    expect(saved.prizes).toHaveLength(3);
    expect(saved.prizes[0]).toEqual({ position: 1, prizeDescription: 'Celular' });
  });

  it('lanza BadRequestException si alguna categoría no existe en el negocio', async () => {
    categoryRepo.findByIds.mockResolvedValue([makeCategory('cat-1')]);

    await expect(useCase.execute('tenant-1', DTO)).rejects.toThrow('no existe');
    expect(raffleRepo.createRaffle).not.toHaveBeenCalled();
  });

  it('lanza BadRequestException si alguna categoría está inactiva y la nombra', async () => {
    categoryRepo.findByIds.mockResolvedValue([makeCategory('cat-1'), makeCategory('cat-2', 'Milanesas', false)]);

    await expect(useCase.execute('tenant-1', DTO)).rejects.toThrow('"Milanesas" no está activa');
    expect(raffleRepo.createRaffle).not.toHaveBeenCalled();
  });

  it('lanza BadRequestException si el número de premios no coincide con numberOfWinners', async () => {
    await expect(useCase.execute('tenant-1', { ...DTO, numberOfWinners: 2 })).rejects.toThrow(BadRequestException);
    expect(raffleRepo.createRaffle).not.toHaveBeenCalled();
  });

  it('lanza BadRequestException si las posiciones no son consecutivas (ej. [1, 3])', async () => {
    const bad: CreateRaffleDto = {
      ...DTO,
      numberOfWinners: 2,
      prizes: [
        { position: 1, prizeDescription: 'Premio A' },
        { position: 3, prizeDescription: 'Premio B' },
      ],
    };
    await expect(useCase.execute('tenant-1', bad)).rejects.toThrow(BadRequestException);
    expect(raffleRepo.createRaffle).not.toHaveBeenCalled();
  });

  it('lanza BadRequestException si las posiciones no empiezan en 1 (ej. [2, 3])', async () => {
    const bad: CreateRaffleDto = {
      ...DTO,
      numberOfWinners: 2,
      prizes: [
        { position: 2, prizeDescription: 'Premio A' },
        { position: 3, prizeDescription: 'Premio B' },
      ],
    };
    await expect(useCase.execute('tenant-1', bad)).rejects.toThrow(BadRequestException);
    expect(raffleRepo.createRaffle).not.toHaveBeenCalled();
  });

  it('crea un sorteo por monto sin consultar categorías', async () => {
    await useCase.execute('tenant-1', SPENDING_DTO);

    expect(categoryRepo.findByIds).not.toHaveBeenCalled();
    const saved = raffleRepo.createRaffle.mock.calls[0][0];
    expect(saved.ticketMode).toBe('SPENDING_THRESHOLD');
    expect(saved.spendingThreshold).toBe(100);
    expect(saved.productId).toBeNull();
    expect(saved.categoryIds).toEqual([]);
  });

  it('lanza BadRequestException para un sorteo por monto sin spendingThreshold', async () => {
    await expect(
      useCase.execute('tenant-1', { ...SPENDING_DTO, spendingThreshold: undefined }),
    ).rejects.toThrow(BadRequestException);
  });
});
