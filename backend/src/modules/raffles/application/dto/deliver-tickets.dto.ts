import { IsArray, IsUUID, ArrayMinSize } from 'class-validator';

export class DeliverTicketsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  ticketIds: string[];
}
