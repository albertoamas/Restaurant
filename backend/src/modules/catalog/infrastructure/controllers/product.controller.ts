import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { UserRole } from '@pos/shared';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { CurrentTenant } from '../../../../common/decorators/tenant.decorator';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CreateProductUseCase } from '../../application/use-cases/create-product.use-case';
import { UpdateProductUseCase } from '../../application/use-cases/update-product.use-case';
import { ListProductsUseCase } from '../../application/use-cases/list-products.use-case';
import { ToggleProductUseCase } from '../../application/use-cases/toggle-product.use-case';
import { CreateProductDto } from '../../application/dto/create-product.dto';
import { UpdateProductDto } from '../../application/dto/update-product.dto';
import { ProductRepositoryPort, PRODUCT_REPOSITORY_PORT } from '../../domain/ports/product-repository.port';
import { Inject } from '@nestjs/common';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductController {
  constructor(
    private readonly listProducts: ListProductsUseCase,
    private readonly createProduct: CreateProductUseCase,
    private readonly updateProduct: UpdateProductUseCase,
    private readonly toggleProduct: ToggleProductUseCase,
    @Inject(PRODUCT_REPOSITORY_PORT)
    private readonly productRepository: ProductRepositoryPort,
  ) {}

  @Get()
  async findAll(
    @CurrentTenant() tenantId: string,
    @Res({ passthrough: true }) res: Response,
    @Query('categoryId') categoryId?: string,
    @Query('includeInactive') includeInactive?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.listProducts.execute(
      tenantId,
      categoryId,
      includeInactive === 'true',
      page ? +page : 1,
      limit ? +limit : 100,
    );
    res.setHeader('X-Total-Count', result.total);
    return result.data;
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.productRepository.findById(id, tenantId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER)
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateProductDto) {
    return this.createProduct.execute(tenantId, dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.updateProduct.execute(id, tenantId, dto);
  }

  @Patch(':id/toggle')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER)
  toggle(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.toggleProduct.execute(id, tenantId);
  }
}
