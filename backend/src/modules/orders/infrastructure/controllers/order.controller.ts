import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
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
import { CreateOrderUseCase } from '../../application/use-cases/create-order.use-case';
import { GetOrderUseCase } from '../../application/use-cases/get-order.use-case';
import { ListOrdersUseCase } from '../../application/use-cases/list-orders.use-case';
import { UpdateOrderStatusUseCase } from '../../application/use-cases/update-order-status.use-case';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly listOrdersUseCase: ListOrdersUseCase,
    private readonly getOrderUseCase: GetOrderUseCase,
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
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
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    // Cashiers can only see their own branch; owners can filter or see all
    const effectiveBranchId = user.branchId ?? branchId;
    return this.listOrdersUseCase.execute(tenantId, { date, from, to, status, branchId: effectiveBranchId, customerId, page, limit });
  }

  @Get(':id')
  findOne(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.getOrderUseCase.execute(id, tenantId);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.updateOrderStatusUseCase.execute(id, tenantId, dto.status);
  }
}
