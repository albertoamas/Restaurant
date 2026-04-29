import { BadRequestException, NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { CreateProductUseCase } from './create-product.use-case';
import { ProductRepositoryPort } from '../../domain/ports/product-repository.port';
import { CategoryRepositoryPort } from '../../domain/ports/category-repository.port';
import { TenantRepositoryPort } from '../../../tenant/domain/ports/tenant-repository.port';
import { PlanLimitService } from '../../../plans/application/plan-limit.service';
import { Category } from '../../domain/entities/category.entity';
import { Product } from '../../domain/entities/product.entity';
import { Tenant } from '../../../tenant/domain/entities/tenant.entity';

const TENANT_ID = 'tenant-1';
const CATEGORY_ID = 'cat-1';

function makeCategory(): Category {
  return Category.reconstitute({ id: CATEGORY_ID, tenantId: TENANT_ID, name: 'Bebidas', sortOrder: 0, isActive: true });
}

function makeProduct(): Product {
  return Product.reconstitute({ id: 'prod-1', tenantId: TENANT_ID, categoryId: CATEGORY_ID, name: 'Café', price: 10, imageUrl: null, isActive: true, createdAt: new Date() });
}

const DTO = { categoryId: CATEGORY_ID, name: 'Café', price: 10 };

describe('CreateProductUseCase', () => {
  let useCase: CreateProductUseCase;
  let productRepo: MockProxy<ProductRepositoryPort>;
  let categoryRepo: MockProxy<CategoryRepositoryPort>;
  let tenantRepo: MockProxy<TenantRepositoryPort>;
  let planLimitService: MockProxy<PlanLimitService>;

  beforeEach(() => {
    productRepo       = mock<ProductRepositoryPort>();
    categoryRepo      = mock<CategoryRepositoryPort>();
    tenantRepo        = mock<TenantRepositoryPort>();
    planLimitService  = mock<PlanLimitService>();
    useCase = new CreateProductUseCase(productRepo, categoryRepo, tenantRepo, planLimitService);

    tenantRepo.findById.mockResolvedValue(null);
    categoryRepo.findById.mockResolvedValue(makeCategory());
    productRepo.save.mockResolvedValue(makeProduct());
  });

  it('crea y guarda el producto correctamente', async () => {
    const result = await useCase.execute(TENANT_ID, DTO);
    expect(productRepo.save).toHaveBeenCalledTimes(1);
    expect(result.name).toBe('Café');
  });

  it('lanza NotFoundException si la categoría no existe', async () => {
    categoryRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute(TENANT_ID, DTO)).rejects.toThrow(NotFoundException);
    expect(productRepo.save).not.toHaveBeenCalled();
  });

  it('verifica el límite del plan cuando el tenant existe', async () => {
    const tenant = { plan: 'BASICO' } as unknown as Tenant;
    tenantRepo.findById.mockResolvedValue(tenant);
    planLimitService.getPlan.mockResolvedValue({ maxProducts: 50 } as any);
    productRepo.countByTenant.mockResolvedValue(10);

    await useCase.execute(TENANT_ID, DTO);

    expect(planLimitService.getPlan).toHaveBeenCalledWith('BASICO');
    expect(planLimitService.assertWithinLimit).toHaveBeenCalledWith('productos', { maxProducts: 50 }, 10);
  });

  it('no verifica límite de plan cuando el tenant no existe', async () => {
    tenantRepo.findById.mockResolvedValue(null);
    await useCase.execute(TENANT_ID, DTO);
    expect(planLimitService.assertWithinLimit).not.toHaveBeenCalled();
  });
});
