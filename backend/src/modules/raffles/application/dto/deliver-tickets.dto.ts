import { IsArray, IsUUID, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class DeliverTicketsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1000)
  @IsUUID('4', { each: true })
  ticketIds: string[];
}
