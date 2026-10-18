import { v4 as uuidv4 } from 'uuid';
import { RaffleTicketMode } from '@pos/shared';

export type RaffleStatus = 'ACTIVE' | 'CLOSED' | 'DRAWING' | 'DRAWN';

/** Estados en los que se puede sortear: el sorteo ya cerró (no entran tickets) o está en curso. */
export const DRAWABLE_STATUSES: readonly RaffleStatus[] = ['CLOSED', 'DRAWING'];

/** Estados en los que aún se pueden retirar tickets por un pedido cancelado (después el ánfora ya se usó). */
export const TICKET_REVOCABLE_STATUSES: readonly RaffleStatus[] = ['ACTIVE', 'CLOSED'];

/** Estados con ganadores sorteados: los únicos en que se puede anular uno. */
export const WINNER_VOIDABLE_STATUSES: readonly RaffleStatus[] = ['DRAWING', 'DRAWN'];

/**
 * Puesto cuyo ganador toca registrar: el más alto sin ganador activo (se sortea del último lugar
 * al primero). null cuando todos los puestos ya tienen ganador.
 */
export function nextPositionToDraw(numberOfWinners: number, awardedPositions: Iterable<number>): number | null {
  const awarded = new Set(awardedPositions);
  for (let position = numberOfWinners; position >= 1; position--) {
    if (!awarded.has(position)) return position;
  }
  return null;
}

/** Tickets que corresponden a un gasto acumulado: uno por cada múltiplo completo del umbral. */
export function ticketsEarned(totalSpent: number, threshold: number): number {
  return Math.floor(totalSpent / threshold);
}

/** Una línea del pedido, con la categoría de su producto, para saber qué tickets otorga. */
export interface OrderTicketItem {
  productId: string;
  categoryId: string;
  quantity: number;
}

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
  categoryIds: string[];
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
  categoryIds?: string[];
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
  readonly categoryIds: string[];
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
      categoryIds: opts.categoryIds ?? [],
      prizes: opts.prizes,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: RaffleProps): Raffle {
    return new Raffle(props);
  }

  /**
   * Tickets que otorgan las líneas de un pedido: uno por unidad que cumple la regla del sorteo
   * (el producto, en los sorteos anteriores; cualquier producto de sus categorías, en los nuevos).
   * Los sorteos por monto no dependen de las líneas.
   */
  ticketsForItems(items: OrderTicketItem[]): number {
    const matches = (item: OrderTicketItem): boolean => {
      if (this.ticketMode === 'PRODUCT_MATCH') return item.productId === this.productId;
      if (this.ticketMode === 'CATEGORY_MATCH') return this.categoryIds.includes(item.categoryId);
      return false;
    };
    return items.filter(matches).reduce((total, item) => total + item.quantity, 0);
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

  /**
   * Puede recibir el próximo ganador. Exige haber cerrado el sorteo: con el ánfora abierta
   * seguirían entrando tickets mientras se elige, y al sortear el primer ganador dejarían de entrar.
   */
  get isDrawable(): boolean {
    return DRAWABLE_STATUSES.includes(this.status);
  }

  get isWinnerVoidable(): boolean {
    return WINNER_VOIDABLE_STATUSES.includes(this.status);
  }

  /** Un sorteo abierto sigue entregando tickets: primero se cierra. */
  get isDeletable(): boolean {
    return this.status !== 'ACTIVE';
  }

  get isReopenable(): boolean {
    return this.status === 'CLOSED';
  }
}
