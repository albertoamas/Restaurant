import { BadRequestException, NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { CreateRaffleUseCase } from './create-raffle.use-case';
import { RaffleRepositoryPort } from '../../domain/ports/raffle-repository.port';
import { ProductRepositoryPort } from '../../../catalog/domain/ports/product-repository.port';
import { Product } from '../../../catalog/domain/entities/product.entity';
import { CreateRaffleDto } from '../dto/create-raffle.dto';

function makeProduct(isActive = true): Product {
  return Product.reconstitute({
    id: 'prod-1', tenantId: 'tenant-1', categoryId: 'cat-1',
    name: 'Combo Sorteo', price: 50, imageUrl: null, isActive,
    createdAt: new Date(),
  });
}

const DTO: CreateRaffleDto = {
  name: 'Sorteo Navidad',
  productId: 'prod-1',
  numberOfWinners: 3,
  prizes: [
    { position: 1, prizeDescription: 'Celular' },
    { position: 2, prizeDescription: 'Televisor' },
    { position: 3, prizeDescription: 'Bicicleta' },
  ],
};

describe('CreateRaffleUseCase', () => {
  let useCase: CreateRaffleUseCase;
  let raffleRepo: MockProxy<RaffleRepositoryPort>;
  let productRepo: MockProxy<ProductRepositoryPort>;

  beforeEach(() => {
    raffleRepo  = mock<RaffleRepositoryPort>();
    productRepo = mock<ProductRepositoryPort>();
    useCase     = new CreateRaffleUseCase(raffleRepo, productRepo);

    raffleRepo.saveRaffle.mockResolvedValue({} as any);
    raffleRepo.findRaffleWithTickets.mockResolvedValue({ id: 'r1', tickets: [], numberOfWinners: 3 } as any);
  });

  it('crea el sorteo cuando el producto existe y está activo', async () => {
    productRepo.findById.mockResolvedValue(makeProduct());
    const result = await useCase.execute('tenant-1', DTO);
    expect(raffleRepo.saveRaffle).toHaveBeenCalledTimes(1);
    expect(result).toBeDefined();
  });

  it('el sorteo guardado tiene el numberOfWinners correcto', async () => {
    productRepo.findById.mockResolvedValue(makeProduct());
    await useCase.execute('tenant-1', DTO);
    const saved = raffleRepo.saveRaffle.mock.calls[0][0];
    expect(saved.numberOfWinners).toBe(3);
  });

  it('el sorteo guardado tiene los premios correctos', async () => {
    productRepo.findById.mockResolvedValue(makeProduct());
    await useCase.execute('tenant-1', DTO);
    const saved = raffleRepo.saveRaffle.mock.calls[0][0];
    expect(saved.prizes).toHaveLength(3);
    expect(saved.prizes[0]).toEqual({ position: 1, prizeDescription: 'Celular' });
  });

  it('lanza BadRequestException si el número de premios no coincide con numberOfWinners', async () => {
    productRepo.findById.mockResolvedValue(makeProduct());
    const bad: CreateRaffleDto = { ...DTO, numberOfWinners: 2 };
    await expect(useCase.execute('tenant-1', bad)).rejects.toThrow(BadRequestException);
    expect(raffleRepo.saveRaffle).not.toHaveBeenCalled();
  });

  it('lanza BadRequestException si las posiciones no son consecutivas (ej. [1, 3])', async () => {
    productRepo.findById.mockResolvedValue(makeProduct());
    const bad: CreateRaffleDto = {
      ...DTO,
      numberOfWinners: 2,
      prizes: [
        { position: 1, prizeDescription: 'Premio A' },
        { position: 3, prizeDescription: 'Premio B' },
      ],
    };
    await expect(useCase.execute('tenant-1', bad)).rejects.toThrow(BadRequestException);
    expect(raffleRepo.saveRaffle).not.toHaveBeenCalled();
  });

  it('lanza BadRequestException si las posiciones no empiezan en 1 (ej. [2, 3])', async () => {
    productRepo.findById.mockResolvedValue(makeProduct());
    const bad: CreateRaffleDto = {
      ...DTO,
      numberOfWinners: 2,
      prizes: [
        { position: 2, prizeDescription: 'Premio A' },
        { position: 3, prizeDescription: 'Premio B' },
      ],
    };
    await expect(useCase.execute('tenant-1', bad)).rejects.toThrow(BadRequestException);
    expect(raffleRepo.saveRaffle).not.toHaveBeenCalled();
  });

  it('lanza NotFoundException si el producto no existe', async () => {
    productRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute('tenant-1', DTO)).rejects.toThrow(NotFoundException);
    expect(raffleRepo.saveRaffle).not.toHaveBeenCalled();
  });

  it('lanza BadRequestException si el producto está inactivo', async () => {
    productRepo.findById.mockResolvedValue(makeProduct(false));
    await expect(useCase.execute('tenant-1', DTO)).rejects.toThrow(BadRequestException);
    expect(raffleRepo.saveRaffle).not.toHaveBeenCalled();
  });
});
