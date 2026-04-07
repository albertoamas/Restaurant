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
  UseGuards,
} from '@nestjs/common';
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
import { DeliverTicketUseCase } from '../../application/use-cases/deliver-ticket.use-case';
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
    private readonly deliverTicketUseCase: DeliverTicketUseCase,
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
  findAll(
    @CurrentTenant() tenantId: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.listCustomers.execute(
      tenantId,
      q,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
    );
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

  @Post(':id/tickets/deliver')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER)
  deliverTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.deliverTicketUseCase.execute(id, tenantId);
  }
}
