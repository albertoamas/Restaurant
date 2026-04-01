import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderType, PaymentMethod } from '@pos/shared';

export class CreateOrderItemDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  @Max(999)
  quantity: number;
}

export class CreateCustomerInlineDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class CreateOrderDto {
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsEnum(OrderType)
  type: OrderType;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateCustomerInlineDto)
  createCustomer?: CreateCustomerInlineDto;
}
