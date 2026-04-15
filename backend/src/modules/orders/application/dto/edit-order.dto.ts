import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderType, PaymentMethod } from '@pos/shared';

export class EditCustomerInlineDto {
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

export class EditOrderDto {
  @IsOptional()
  @IsEnum(OrderType)
  type?: OrderType;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsUUID()
  customerId?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => EditCustomerInlineDto)
  createCustomer?: EditCustomerInlineDto;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;
}
