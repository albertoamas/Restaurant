import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { TenantModule } from '../tenant/tenant.module';
import { PlansModule } from '../plans/plans.module';

// Repository implementations
import { CategoryRepository } from './infrastructure/persistence/category.repository';
import { ProductRepository } from './infrastructure/persistence/product.repository';

// Port tokens
import { CATEGORY_REPOSITORY_PORT } from './domain/ports/category-repository.port';
import { PRODUCT_REPOSITORY_PORT } from './domain/ports/product-repository.port';

// Category use cases
import { CreateCategoryUseCase } from './application/use-cases/create-category.use-case';
import { UpdateCategoryUseCase } from './application/use-cases/update-category.use-case';
import { ListCategoriesUseCase } from './application/use-cases/list-categories.use-case';
import { DeleteCategoryUseCase } from './application/use-cases/delete-category.use-case';

// Product use cases
import { CreateProductUseCase } from './application/use-cases/create-product.use-case';
import { UpdateProductUseCase } from './application/use-cases/update-product.use-case';
import { ListProductsUseCase } from './application/use-cases/list-products.use-case';
import { ToggleProductUseCase } from './application/use-cases/toggle-product.use-case';

// Controllers
import { CategoryController } from './infrastructure/controllers/category.controller';
import { ProductController } from './infrastructure/controllers/product.controller';

const categoryUseCases = [
  CreateCategoryUseCase,
  UpdateCategoryUseCase,
  ListCategoriesUseCase,
  DeleteCategoryUseCase,
];

const productUseCases = [
  CreateProductUseCase,
  UpdateProductUseCase,
  ListProductsUseCase,
  ToggleProductUseCase,
];

@Module({
  imports: [EventsModule, TenantModule, PlansModule],
  controllers: [CategoryController, ProductController],
  providers: [
    {
      provide: CATEGORY_REPOSITORY_PORT,
      useClass: CategoryRepository,
    },
    {
      provide: PRODUCT_REPOSITORY_PORT,
      useClass: ProductRepository,
    },
    ...categoryUseCases,
    ...productUseCases,
  ],
  exports: [CATEGORY_REPOSITORY_PORT, PRODUCT_REPOSITORY_PORT],
})
export class CatalogModule {}
