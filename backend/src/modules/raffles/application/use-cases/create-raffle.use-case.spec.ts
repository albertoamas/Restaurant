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

const DTO: CreateRaffleDto = { name: 'Sorteo Navidad', productId: 'prod-1' };

describe('CreateRaffleUseCase', () => {
  let useCase: CreateRaffleUseCase;
  let raffleRepo: MockProxy<RaffleRepositoryPort>;
  let productRepo: MockProxy<ProductRepositoryPort>;

  beforeEach(() => {
    raffleRepo  = mock<RaffleRepositoryPort>();
    productRepo = mock<ProductRepositoryPort>();
    useCase     = new CreateRaffleUseCase(raffleRepo, productRepo);

    raffleRepo.saveRaffle.mockResolvedValue({} as any);
    raffleRepo.findRaffleWithTickets.mockResolvedValue({ id: 'r1', tickets: [] } as any);
  });

  it('crea el sorteo cuando el producto existe y está activo', async () => {
    productRepo.findById.mockResolvedValue(makeProduct());
    const result = await useCase.execute('tenant-1', DTO);
    expect(raffleRepo.saveRaffle).toHaveBeenCalledTimes(1);
    expect(result).toBeDefined();
  });

  it('lanza NotFoundException si el producto no existe', async () => {
    productRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute('tenant-1', DTO)).rejects.toThrow(NotFoundException);
  });

  it('lanza BadRequestException si el producto está inactivo', async () => {
    productRepo.findById.mockResolvedValue(makeProduct(false));
    await expect(useCase.execute('tenant-1', DTO)).rejects.toThrow(BadRequestException);
  });
});
