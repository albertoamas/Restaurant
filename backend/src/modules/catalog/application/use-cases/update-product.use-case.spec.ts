import { NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { UpdateProductUseCase } from './update-product.use-case';
import { ProductRepositoryPort } from '../../domain/ports/product-repository.port';
import { CategoryRepositoryPort } from '../../domain/ports/category-repository.port';
import { Product } from '../../domain/entities/product.entity';
import { Category } from '../../domain/entities/category.entity';

jest.mock('fs/promises', () => ({ unlink: jest.fn().mockResolvedValue(undefined) }));
import { unlink } from 'fs/promises';

const TENANT_ID = 'tenant-1';

function makeProduct(imageUrl: string | null = '/uploads/old.webp'): Product {
  return Product.reconstitute({
    id: 'prod-1', tenantId: TENANT_ID, categoryId: 'cat-1',
    name: 'Café', price: 10, imageUrl, isActive: true, createdAt: new Date(),
  });
}

function makeCategory(): Category {
  return Category.reconstitute({ id: 'cat-2', tenantId: TENANT_ID, name: 'Nuevas', sortOrder: 0, isActive: true });
}

describe('UpdateProductUseCase', () => {
  let useCase: UpdateProductUseCase;
  let productRepo: MockProxy<ProductRepositoryPort>;
  let categoryRepo: MockProxy<CategoryRepositoryPort>;

  beforeEach(() => {
    productRepo  = mock<ProductRepositoryPort>();
    categoryRepo = mock<CategoryRepositoryPort>();
    useCase = new UpdateProductUseCase(productRepo, categoryRepo);
    jest.clearAllMocks();
  });

  it('actualiza el producto correctamente', async () => {
    const product = makeProduct();
    productRepo.findById.mockResolvedValue(product);
    productRepo.save.mockResolvedValue({ ...product, name: 'Café Solo' } as unknown as Product);

    await useCase.execute('prod-1', TENANT_ID, { name: 'Café Solo' });
    expect(productRepo.save).toHaveBeenCalledTimes(1);
  });

  it('lanza NotFoundException si el producto no existe', async () => {
    productRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute('prod-x', TENANT_ID, { name: 'X' })).rejects.toThrow(NotFoundException);
    expect(productRepo.save).not.toHaveBeenCalled();
  });

  it('lanza NotFoundException si la nueva categoría no existe', async () => {
    productRepo.findById.mockResolvedValue(makeProduct());
    categoryRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute('prod-1', TENANT_ID, { categoryId: 'cat-x' })).rejects.toThrow(NotFoundException);
    expect(productRepo.save).not.toHaveBeenCalled();
  });

  it('elimina la imagen anterior cuando se cambia imageUrl', async () => {
    const product = makeProduct('/uploads/old.webp');
    productRepo.findById.mockResolvedValue(product);
    productRepo.save.mockResolvedValue(product);

    await useCase.execute('prod-1', TENANT_ID, { imageUrl: '/uploads/new.webp' });

    expect(unlink).toHaveBeenCalledWith(expect.stringContaining('old.webp'));
  });

  it('NO elimina imagen si imageUrl no cambia', async () => {
    const product = makeProduct('/uploads/same.webp');
    productRepo.findById.mockResolvedValue(product);
    productRepo.save.mockResolvedValue(product);

    await useCase.execute('prod-1', TENANT_ID, { imageUrl: '/uploads/same.webp' });
    expect(unlink).not.toHaveBeenCalled();
  });

  it('NO elimina imagen si el producto no tenía imagen previa', async () => {
    const product = makeProduct(null);
    productRepo.findById.mockResolvedValue(product);
    productRepo.save.mockResolvedValue(product);

    await useCase.execute('prod-1', TENANT_ID, { imageUrl: '/uploads/new.webp' });
    expect(unlink).not.toHaveBeenCalled();
  });

  it('NO elimina imagen si imageUrl no está en el DTO (sin cambio)', async () => {
    const product = makeProduct('/uploads/keep.webp');
    productRepo.findById.mockResolvedValue(product);
    productRepo.save.mockResolvedValue(product);

    await useCase.execute('prod-1', TENANT_ID, { name: 'Solo nombre' });
    expect(unlink).not.toHaveBeenCalled();
  });
});
