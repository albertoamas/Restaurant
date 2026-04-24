import { RaffleDto, RaffleTicketDto } from '@pos/shared';
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

export interface RaffleRepositoryPort {
  /** Persiste un sorteo nuevo junto con sus premios en una sola transacción. */
  createRaffle(raffle: Raffle): Promise<void>;

  /** Actualiza estado y metadatos del sorteo. No toca la tabla de premios. */
  saveRaffle(raffle: Raffle): Promise<void>;

  findRaffleById(id: string, tenantId: string): Promise<Raffle | null>;
  findAllRaffles(tenantId: string): Promise<RaffleDto[]>;
  findRaffleWithTickets(id: string, tenantId: string): Promise<(RaffleDto & { tickets: RaffleTicketDto[] }) | null>;
  findActiveRafflesForProducts(tenantId: string, productIds: string[]): Promise<Raffle[]>;

  /**
   * Inserta tickets asignando números secuenciales de forma atómica.
   * Usa SELECT FOR UPDATE sobre la fila del sorteo para serializar
   * inserciones concurrentes y evitar colisiones en el índice UNIQUE(raffleId, ticketNumber).
   */
  addTickets(raffleId: string, inputs: NewTicketInput[]): Promise<void>;

  deleteRaffle(id: string, tenantId: string): Promise<void>;
  deleteTicketsByOrderId(tenantId: string, orderId: string): Promise<void>;

  addWinner(winner: RaffleWinner): Promise<RaffleWinner>;
  findWinnersByRaffleId(raffleId: string): Promise<RaffleWinner[]>;
  voidWinner(winnerId: string, raffleId: string, tenantId: string): Promise<void>;
}
