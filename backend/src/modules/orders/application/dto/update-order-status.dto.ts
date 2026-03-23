import { IsEnum } from 'class-validator';
import { OrderStatus } from '@pos/shared';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
