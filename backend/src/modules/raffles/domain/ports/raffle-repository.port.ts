import { RaffleDto, RaffleTicketDto } from '@pos/shared';
import { Raffle } from '../entities/raffle.entity';
import { RaffleTicket } from '../entities/raffle-ticket.entity';

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
}
