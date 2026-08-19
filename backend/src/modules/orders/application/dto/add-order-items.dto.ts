import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateNested,
  ArrayMinSize,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@pos/shared';

export class AddOrderItemDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  @Max(999)
  quantity: number;
}

export class AddItemsPaymentDto {
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsNumber()
  @Min(0.01)
  @Max(999999)
  amount: number;
}

export class AddOrderItemsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AddOrderItemDto)
  items: AddOrderItemDto[];

  /** Required when the order is already paid — amount must equal the price difference */
  @IsOptional()
  @ValidateNested()
  @Type(() => AddItemsPaymentDto)
  payment?: AddItemsPaymentDto;
}
