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
  /** Auditoría de la anulación: solo presentes cuando voided === true. */
  voidedAt: string | null;
  voidReason: string | null;
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
  /** Cuándo se imprimió para el ánfora. null = pendiente de imprimir. */
  printedAt: string | null;
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

/** Marca (printed: true) o desmarca los tickets como impresos y puestos en el ánfora. */
export interface SetTicketsPrintedRequest {
  ticketIds: string[];
  printed: boolean;
}

/** Motivo obligatorio: queda registrado junto con quién y cuándo anuló al ganador. */
export interface VoidWinnerRequest {
  reason: string;
}

/** Payload de SOCKET_EVENTS.RAFFLE_TICKETS_REVOKED: tickets retirados porque se canceló su pedido. */
export interface RaffleTicketsRevokedPayload {
  raffleId: string;
  /** Números de los tickets que ya estaban impresos (en el ánfora) y hay que sacar de ella. */
  printedTicketNumbers: number[];
}

/** Solo name, description y los textos de premios son editables en cualquier estado; el premio de un lugar que ya tiene ganador no. */
export interface UpdateRaffleRequest {
  name?: string;
  description?: string;
  prizes?: RafflePrizeDto[];
}
