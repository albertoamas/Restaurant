export type RaffleStatus = 'ACTIVE' | 'CLOSED' | 'DRAWN';

export interface RaffleDto {
  id: string;
  name: string;
  description: string | null;
  status: RaffleStatus;
  prizeDescription: string | null;
  productId: string | null;
  productName: string | null;
  winnerCustomerId: string | null;
  winnerTicketId: string | null;
  winnerCustomer: { id: string; name: string; phone: string | null } | null;
  ticketCount: number;
  drawnAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RaffleTicketDto {
  id: string;
  raffleId: string;
  customerId: string;
  customer: { id: string; name: string; phone: string | null };
  ticketNumber: number;
  orderId: string | null;
  createdAt: string;
}

export interface CreateRaffleRequest {
  name: string;
  description?: string;
  prizeDescription?: string;
  productId: string;
}
