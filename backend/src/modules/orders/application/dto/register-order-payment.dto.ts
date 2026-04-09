import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderPaymentDto } from './create-order.dto';

export class RegisterOrderPaymentDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderPaymentDto)
  payments: CreateOrderPaymentDto[];
}
