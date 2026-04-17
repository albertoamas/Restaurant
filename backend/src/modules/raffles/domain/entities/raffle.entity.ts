import { v4 as uuidv4 } from 'uuid';

export type RaffleStatus = 'ACTIVE' | 'CLOSED' | 'DRAWN';

export interface RaffleProps {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  status: RaffleStatus;
  prizeDescription: string | null;
  productId: string | null;
  winnerCustomerId: string | null;
  winnerTicketId: string | null;
  drawnAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Raffle {
  readonly id: string;
  readonly tenantId: string;
  name: string;
  description: string | null;
  status: RaffleStatus;
  prizeDescription: string | null;
  productId: string | null;
  winnerCustomerId: string | null;
  winnerTicketId: string | null;
  drawnAt: Date | null;
  readonly createdAt: Date;
  updatedAt: Date;

  private constructor(props: RaffleProps) {
    Object.assign(this, props);
  }

  static create(
    tenantId: string,
    name: string,
    productId: string,
    description?: string,
    prizeDescription?: string,
  ): Raffle {
    const now = new Date();
    return new Raffle({
      id: uuidv4(),
      tenantId,
      name: name.trim(),
      description: description?.trim() || null,
      status: 'ACTIVE',
      prizeDescription: prizeDescription?.trim() || null,
      productId,
      winnerCustomerId: null,
      winnerTicketId: null,
      drawnAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: RaffleProps): Raffle {
    return new Raffle(props);
  }

  close(): void {
    this.status = 'CLOSED';
    this.updatedAt = new Date();
  }

  reopen(): void {
    this.status = 'ACTIVE';
    this.updatedAt = new Date();
  }

  draw(winnerCustomerId: string, winnerTicketId: string): void {
    this.status = 'DRAWN';
    this.winnerCustomerId = winnerCustomerId;
    this.winnerTicketId = winnerTicketId;
    this.drawnAt = new Date();
    this.updatedAt = new Date();
  }

  get isActive(): boolean {
    return this.status === 'ACTIVE';
  }

  get isDrawable(): boolean {
    return this.status === 'ACTIVE' || this.status === 'CLOSED';
  }

  get isDeletable(): boolean {
    return this.status !== 'DRAWN';
  }
}
