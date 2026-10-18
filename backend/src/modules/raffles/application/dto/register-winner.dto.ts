import { IsInt, Min } from 'class-validator';

export class RegisterWinnerDto {
  @IsInt()
  @Min(1)
  ticketNumber: number;
}
