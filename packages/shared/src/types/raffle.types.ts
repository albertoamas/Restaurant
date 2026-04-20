export type RaffleStatus = 'ACTIVE' | 'CLOSED' | 'DRAWING' | 'DRAWN';

export interface RafflePrizeDto {
  position: number;
  prizeDescription: string;
}

export interface RaffleWinnerDto {
  id: string;
  position: number;
  prizeDescription: string | null;
  customerId: string;
  customer: { id: string; name: string; phone: string | null };
  ticketId: string;
  ticketNumber: number;
  drawnAt: string;
  voided: boolean;
}

export interface RaffleDto {
  id: string;
  name: string;
  description: string | null;
  status: RaffleStatus;
  numberOfWinners: number;
  productId: string | null;
  productName: string | null;
  prizes: RafflePrizeDto[];
  winners: RaffleWinnerDto[];
  /** Posición que se sorteará en el próximo draw. null cuando status === 'DRAWN'. */
  nextPositionToDraw: number | null;
  ticketCount: number;
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
  productId: string;
  numberOfWinners: number;
  prizes: RafflePrizeDto[];
}
