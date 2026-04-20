import { RaffleDto, RaffleTicketDto } from '@pos/shared';
import { Raffle } from '../entities/raffle.entity';
import { RaffleTicket } from '../entities/raffle-ticket.entity';
import { RaffleWinner } from '../entities/raffle-winner.entity';

export const RAFFLE_REPOSITORY_PORT = 'RaffleRepositoryPort';

export interface RaffleRepositoryPort {
  saveRaffle(raffle: Raffle): Promise<Raffle>;
  findRaffleById(id: string, tenantId: string): Promise<Raffle | null>;
  findAllRaffles(tenantId: string): Promise<RaffleDto[]>;
  findRaffleWithTickets(id: string, tenantId: string): Promise<(RaffleDto & { tickets: RaffleTicketDto[] }) | null>;
  findActiveRafflesForProducts(tenantId: string, productIds: string[]): Promise<Raffle[]>;

  addTickets(tickets: RaffleTicket[]): Promise<RaffleTicket[]>;
  deleteRaffle(id: string, tenantId: string): Promise<void>;
  deleteTicketsByOrderId(tenantId: string, orderId: string): Promise<void>;
  getNextTicketNumber(raffleId: string): Promise<number>;

  /** Persiste un ganador y devuelve la entidad con id y drawnAt asignados. */
  addWinner(winner: RaffleWinner): Promise<RaffleWinner>;

  /** Retorna todos los ganadores ya sorteados de un sorteo, ordenados por posición desc. */
  findWinnersByRaffleId(raffleId: string): Promise<RaffleWinner[]>;

  /** Marca un ganador como anulado y actualiza el estado del sorteo si es necesario. */
  voidWinner(winnerId: string, raffleId: string, tenantId: string): Promise<void>;
}
