import { v4 as uuidv4 } from 'uuid';

export interface RaffleTicketProps {
  id: string;
  tenantId: string;
  raffleId: string;
  customerId: string;
  ticketNumber: number;
  orderId: string | null;
  createdAt: Date;
}

export class RaffleTicket {
  readonly id: string;
  readonly tenantId: string;
  readonly raffleId: string;
  readonly customerId: string;
  readonly ticketNumber: number;
  readonly orderId: string | null;
  readonly createdAt: Date;

  private constructor(props: RaffleTicketProps) {
    Object.assign(this, props);
  }

  static create(props: Omit<RaffleTicketProps, 'id' | 'createdAt'>): RaffleTicket {
    return new RaffleTicket({
      ...props,
      id: uuidv4(),
      createdAt: new Date(),
    });
  }

  static reconstitute(props: RaffleTicketProps): RaffleTicket {
    return new RaffleTicket(props);
  }
}
