export type RaffleStatus = 'ACTIVE' | 'CLOSED' | 'DRAWING' | 'DRAWN';

export type RaffleTicketMode = 'PRODUCT_MATCH' | 'SPENDING_THRESHOLD';

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
  ticketMode: RaffleTicketMode;
  spendingThreshold: number | null;
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
  delivered: boolean;
  deliveredAt: string | null;
  createdAt: string;
}

export interface RaffleSpendingDto {
  customerId: string;
  customer: { id: string; name: string; phone: string | null };
  totalSpent: number;
  ticketsEarned: number;
}

/** Retorno de GET /raffles/:id — incluye tickets y, para SPENDING_THRESHOLD, acumulados por cliente. */
export type RaffleDetailDto = RaffleDto & {
  tickets: RaffleTicketDto[];
  spendings: RaffleSpendingDto[];
};

export interface CreateRaffleRequest {
  name: string;
  description?: string;
  ticketMode: RaffleTicketMode;
  /** Requerido cuando ticketMode === 'PRODUCT_MATCH'. */
  productId?: string;
  /** Requerido cuando ticketMode === 'SPENDING_THRESHOLD'. Monto en Bs entero positivo. */
  spendingThreshold?: number;
  numberOfWinners: number;
  prizes: RafflePrizeDto[];
}
