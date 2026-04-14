import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrderStatus } from '@pos/shared';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import {
  CurrentTenant,
  CurrentUser,
  JwtPayload,
} from '../../../../common/decorators/tenant.decorator';
import { CreateOrderDto } from '../../application/dto/create-order.dto';
import { UpdateOrderStatusDto } from '../../application/dto/update-order-status.dto';
import { RegisterOrderPaymentDto } from '../../application/dto/register-order-payment.dto';
import { CreateOrderUseCase } from '../../application/use-cases/create-order.use-case';
import { GetOrderUseCase } from '../../application/use-cases/get-order.use-case';
import { ListOrdersUseCase } from '../../application/use-cases/list-orders.use-case';
import { UpdateOrderStatusUseCase } from '../../application/use-cases/update-order-status.use-case';
import { RegisterOrderPaymentUseCase } from '../../application/use-cases/register-order-payment.use-case';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly listOrdersUseCase: ListOrdersUseCase,
    private readonly getOrderUseCase: GetOrderUseCase,
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
    private readonly registerOrderPaymentUseCase: RegisterOrderPaymentUseCase,
  ) {}

  @Post()
  create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateOrderDto,
  ) {
    // CASHIER uses their fixed JWT branchId; OWNER passes branchId in the request body
    const branchId = user.branchId ?? dto.branchId;
    if (!branchId) {
      throw new BadRequestException('branchId is required. Select a branch before creating an order.');
    }
    return this.createOrderUseCase.execute(tenantId, branchId, user.sub, dto);
  }

  @Get()
  findAll(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Query('date') date?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: OrderStatus,
    @Query('branchId') branchId?: string,
    @Query('customerId', new ParseUUIDPipe({ optional: true })) customerId?: string,
    @Query('page',  new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    // Cashiers can only see their own branch; owners can filter or see all
    const effectiveBranchId = user.branchId ?? branchId;
    return this.listOrdersUseCase.execute(tenantId, { date, from, to, status, branchId: effectiveBranchId, customerId, page, limit });
  }

  @Get(':id')
  findOne(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.getOrderUseCase.execute(id, tenantId).then((order) => {
      if (user.branchId && order.branchId !== user.branchId) {
        throw new ForbiddenException('No tienes permisos para ver pedidos de otra sucursal');
      }
      return order;
    });
  }

  @Post(':id/payments')
  registerPayments(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegisterOrderPaymentDto,
  ) {
    return this.registerOrderPaymentUseCase.execute(tenantId, id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.getOrderUseCase.execute(id, tenantId).then(async (order) => {
      if (user.branchId && order.branchId !== user.branchId) {
        throw new ForbiddenException('No tienes permisos para actualizar pedidos de otra sucursal');
      }
      return this.updateOrderStatusUseCase.execute(id, tenantId, dto.status);
    });
  }
}
