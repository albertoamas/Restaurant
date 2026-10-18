export type RaffleStatus = 'ACTIVE' | 'CLOSED' | 'DRAWING' | 'DRAWN';

/** PRODUCT_MATCH quedó solo para los sorteos anteriores: los nuevos son por categorías o por monto. */
export type RaffleTicketMode = 'PRODUCT_MATCH' | 'CATEGORY_MATCH' | 'SPENDING_THRESHOLD';

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
  /** Categorías que dan tickets (sorteos CATEGORY_MATCH). */
  categories: Array<{ id: string; name: string }>;
  prizes: RafflePrizeDto[];
  winners: RaffleWinnerDto[];
  /** Puesto cuyo ganador se registra a continuación (del último al primero). null cuando status === 'DRAWN'. */
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
  /** Los sorteos nuevos son 'CATEGORY_MATCH' o 'SPENDING_THRESHOLD'. */
  ticketMode: Exclude<RaffleTicketMode, 'PRODUCT_MATCH'>;
  /** Requerido cuando ticketMode === 'CATEGORY_MATCH': un ticket por unidad comprada de estas categorías. */
  categoryIds?: string[];
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

/** El ganador se saca de la ánfora física: se registra por el número de su ticket. */
export interface RegisterWinnerRequest {
  ticketNumber: number;
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
