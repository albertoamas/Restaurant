import { v4 as uuidv4 } from 'uuid';
import { RaffleTicketMode } from '@pos/shared';

export type RaffleStatus = 'ACTIVE' | 'CLOSED' | 'DRAWING' | 'DRAWN';

export interface RafflePrize {
  position: number;
  prizeDescription: string;
}

export interface RaffleProps {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  status: RaffleStatus;
  numberOfWinners: number;
  ticketMode: RaffleTicketMode;
  spendingThreshold: number | null;
  productId: string | null;
  prizes: RafflePrize[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRaffleOptions {
  tenantId: string;
  name: string;
  description?: string;
  ticketMode: RaffleTicketMode;
  productId: string | null;
  spendingThreshold: number | null;
  numberOfWinners: number;
  prizes: RafflePrize[];
}

export class Raffle {
  readonly id: string;
  readonly tenantId: string;
  name: string;
  description: string | null;
  status: RaffleStatus;
  numberOfWinners: number;
  readonly ticketMode: RaffleTicketMode;
  readonly spendingThreshold: number | null;
  productId: string | null;
  prizes: RafflePrize[];
  readonly createdAt: Date;
  updatedAt: Date;

  private constructor(props: RaffleProps) {
    Object.assign(this, props);
  }

  static create(opts: CreateRaffleOptions): Raffle {
    const now = new Date();
    return new Raffle({
      id: uuidv4(),
      tenantId: opts.tenantId,
      name: opts.name.trim(),
      description: opts.description?.trim() || null,
      status: 'ACTIVE',
      numberOfWinners: opts.numberOfWinners,
      ticketMode: opts.ticketMode,
      spendingThreshold: opts.spendingThreshold,
      productId: opts.productId,
      prizes: opts.prizes,
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

  /** Transiciona a DRAWING cuando se sortea el primer ganador. */
  startDrawing(): void {
    this.status = 'DRAWING';
    this.updatedAt = new Date();
  }

  /** Transiciona a DRAWN cuando todos los lugares han sido sorteados. */
  finishDrawing(): void {
    this.status = 'DRAWN';
    this.updatedAt = new Date();
  }

  /** Vuelve a DRAWING tras anular un ganador (desde DRAWN). */
  backToDrawing(): void {
    this.status = 'DRAWING';
    this.updatedAt = new Date();
  }

  get isActive(): boolean {
    return this.status === 'ACTIVE';
  }

  /** Puede recibir el próximo ganador mientras no esté completamente terminado. */
  get isDrawable(): boolean {
    return this.status === 'ACTIVE' || this.status === 'CLOSED' || this.status === 'DRAWING';
  }

  /** No se puede eliminar si el sorteo ya comenzó o terminó. */
  get isDeletable(): boolean {
    return this.status !== 'DRAWN' && this.status !== 'DRAWING';
  }

  get isReopenable(): boolean {
    return this.status === 'CLOSED';
  }
}
