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
  voidedAt: Date | null;
  voidedBy: string | null;
  voidReason: string | null;
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
  voidedAt: Date | null;
  voidedBy: string | null;
  voidReason: string | null;

  private constructor(props: RaffleWinnerProps) {
    Object.assign(this, props);
  }

  static create(
    props: Omit<RaffleWinnerProps, 'id' | 'drawnAt' | 'voided' | 'voidedAt' | 'voidedBy' | 'voidReason'>,
  ): RaffleWinner {
    return new RaffleWinner({
      ...props,
      id: uuidv4(),
      drawnAt: new Date(),
      voided: false,
      voidedAt: null,
      voidedBy: null,
      voidReason: null,
    });
  }

  static reconstitute(props: RaffleWinnerProps): RaffleWinner {
    return new RaffleWinner(props);
  }

  /** Anula al ganador dejando registrado quién lo hizo y por qué. */
  void(voidedBy: string, reason: string): void {
    this.voided = true;
    this.voidedAt = new Date();
    this.voidedBy = voidedBy;
    this.voidReason = reason;
  }
}
