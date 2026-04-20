import { v4 as uuidv4 } from 'uuid';

export interface RaffleWinnerProps {
  id: string;
  tenantId: string;
  raffleId: string;
  customerId: string;
  ticketId: string;
  position: number;
  prizeDescription: string | null;
  drawnAt: Date;
  voided: boolean;
}

export class RaffleWinner {
  readonly id: string;
  readonly tenantId: string;
  readonly raffleId: string;
  readonly customerId: string;
  readonly ticketId: string;
  readonly position: number;
  readonly prizeDescription: string | null;
  readonly drawnAt: Date;
  voided: boolean;

  private constructor(props: RaffleWinnerProps) {
    Object.assign(this, props);
  }

  static create(props: Omit<RaffleWinnerProps, 'id' | 'drawnAt' | 'voided'>): RaffleWinner {
    return new RaffleWinner({
      ...props,
      id: uuidv4(),
      drawnAt: new Date(),
      voided: false,
    });
  }

  static reconstitute(props: RaffleWinnerProps): RaffleWinner {
    return new RaffleWinner(props);
  }
}
