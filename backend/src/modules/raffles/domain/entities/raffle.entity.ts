import { v4 as uuidv4 } from 'uuid';

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
  productId: string | null;
  prizes: RafflePrize[];
  createdAt: Date;
  updatedAt: Date;
}

export class Raffle {
  readonly id: string;
  readonly tenantId: string;
  name: string;
  description: string | null;
  status: RaffleStatus;
  numberOfWinners: number;
  productId: string | null;
  prizes: RafflePrize[];
  readonly createdAt: Date;
  updatedAt: Date;

  private constructor(props: RaffleProps) {
    Object.assign(this, props);
  }

  static create(
    tenantId: string,
    name: string,
    productId: string,
    numberOfWinners: number,
    prizes: RafflePrize[],
    description?: string,
  ): Raffle {
    const now = new Date();
    return new Raffle({
      id: uuidv4(),
      tenantId,
      name: name.trim(),
      description: description?.trim() || null,
      status: 'ACTIVE',
      numberOfWinners,
      productId,
      prizes,
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
