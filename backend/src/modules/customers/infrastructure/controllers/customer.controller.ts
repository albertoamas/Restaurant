import {
  Body,
  Controller,
  Get,
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
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../../../common/decorators/tenant.decorator';
import { CreateCustomerUseCase } from '../../application/use-cases/create-customer.use-case';
import { ListCustomersUseCase } from '../../application/use-cases/list-customers.use-case';
import { GetCustomerUseCase } from '../../application/use-cases/get-customer.use-case';
import { UpdateCustomerUseCase } from '../../application/use-cases/update-customer.use-case';
import { SearchCustomersUseCase } from '../../application/use-cases/search-customers.use-case';
import { CreateCustomerDto } from '../../application/dto/create-customer.dto';
import { UpdateCustomerDto } from '../../application/dto/update-customer.dto';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomerController {
  constructor(
    private readonly createCustomer: CreateCustomerUseCase,
    private readonly listCustomers: ListCustomersUseCase,
    private readonly getCustomer: GetCustomerUseCase,
    private readonly updateCustomer: UpdateCustomerUseCase,
    private readonly searchCustomers: SearchCustomersUseCase,
  ) {}

  // IMPORTANT: /search must be declared before /:id to avoid route collision
  @Get('search')
  search(
    @CurrentTenant() tenantId: string,
    @Query('q') q: string,
  ) {
    return this.searchCustomers.execute(q ?? '', tenantId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER)
  async findAll(
    @CurrentTenant() tenantId: string,
    @Res({ passthrough: true }) res: Response,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortDir') sortDir?: string,
  ) {
    const validSortBy = ['name', 'totalSpent', 'purchaseCount'].includes(sortBy ?? '')
      ? (sortBy as 'name' | 'totalSpent' | 'purchaseCount')
      : undefined;
    const validSortDir = sortDir === 'desc' ? 'desc' : 'asc';
    const result = await this.listCustomers.execute(
      tenantId,
      q,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
      validSortBy,
      validSortDir,
    );
    res.setHeader('X-Total-Count', result.total);
    return result.data;
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER)
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.getCustomer.execute(id, tenantId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER)
  create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateCustomerDto,
  ) {
    return this.createCustomer.execute(tenantId, dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.updateCustomer.execute(id, tenantId, dto);
  }
}
