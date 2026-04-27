import { RaffleDetailDto, RaffleDto } from '@pos/shared';
import { Raffle } from '../entities/raffle.entity';
import { RaffleWinner } from '../entities/raffle-winner.entity';

export const RAFFLE_REPOSITORY_PORT = 'RaffleRepositoryPort';

/** Datos mínimos para crear un ticket — el número secuencial lo asigna el repositorio. */
export interface NewTicketInput {
  id: string;
  tenantId: string;
  raffleId: string;
  customerId: string;
  orderId: string | null;
  createdAt: Date;
}

export interface SpendingResult {
  newTotal: number;
}

export interface RaffleRepositoryPort {
  /** Persiste un sorteo nuevo junto con sus premios en una sola transacción. */
  createRaffle(raffle: Raffle): Promise<void>;

  /** Actualiza estado y metadatos del sorteo. No toca la tabla de premios. */
  saveRaffle(raffle: Raffle): Promise<void>;

  findRaffleById(id: string, tenantId: string): Promise<Raffle | null>;
  findAllRaffles(tenantId: string): Promise<RaffleDto[]>;
  findRaffleWithTickets(id: string, tenantId: string): Promise<RaffleDetailDto | null>;

  /** Retorna sorteos ACTIVE con ticketMode PRODUCT_MATCH cuyos productId estén en la lista. */
  findActiveRafflesForProducts(tenantId: string, productIds: string[]): Promise<Raffle[]>;

  /** Retorna sorteos ACTIVE con ticketMode SPENDING_THRESHOLD. */
  findActiveSpendingRaffles(tenantId: string): Promise<Raffle[]>;

  /**
   * Inserta tickets asignando números secuenciales de forma atómica.
   * Usa SELECT FOR UPDATE sobre la fila del sorteo para serializar
   * inserciones concurrentes y evitar colisiones en el índice UNIQUE(raffleId, ticketNumber).
   */
  addTickets(raffleId: string, inputs: NewTicketInput[]): Promise<void>;

  deleteRaffle(id: string, tenantId: string): Promise<void>;

  /** Borra tickets ligados a una orden (modo PRODUCT_MATCH) de sorteos no en DRAWING/DRAWN. */
  deleteTicketsByOrderId(tenantId: string, orderId: string): Promise<void>;

  addWinner(winner: RaffleWinner): Promise<RaffleWinner>;
  findWinnersByRaffleId(raffleId: string): Promise<RaffleWinner[]>;
  voidWinner(winnerId: string, raffleId: string, tenantId: string): Promise<void>;

  // ── Spending threshold ────────────────────────────────────────────────────

  /**
   * Suma `amount` al gasto acumulado del cliente en el sorteo (upsert atómico).
   * Retorna el nuevo total acumulado tras la suma.
   */
  addCustomerSpending(
    tenantId: string,
    raffleId: string,
    customerId: string,
    amount: number,
  ): Promise<SpendingResult>;

  /**
   * Resta `amount` del gasto acumulado del cliente (mínimo 0).
   * Retorna el nuevo total acumulado tras la resta.
   */
  subtractCustomerSpending(
    tenantId: string,
    raffleId: string,
    customerId: string,
    amount: number,
  ): Promise<SpendingResult>;

  /** Cuenta los tickets actuales del cliente en el sorteo. */
  countTicketsByCustomer(tenantId: string, raffleId: string, customerId: string): Promise<number>;

  /**
   * Borra los `excessCount` tickets más recientes del cliente en el sorteo.
   * Solo actúa si el sorteo está en ACTIVE o CLOSED (no en DRAWING/DRAWN).
   */
  deleteExcessTicketsByCustomer(
    tenantId: string,
    raffleId: string,
    customerId: string,
    excessCount: number,
  ): Promise<void>;
}
