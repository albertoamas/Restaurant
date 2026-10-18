import { RaffleDetailDto, RaffleDto } from '@pos/shared';
import { Raffle, RaffleStatus } from '../entities/raffle.entity';
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

/** Pedido que aporta gasto a un sorteo SPENDING_THRESHOLD. */
export interface OrderSpendingInput {
  tenantId: string;
  raffleId: string;
  customerId: string;
  orderId: string;
  amount: number;
}

/** Ticket retirado porque su pedido se canceló. */
export interface RevokedTicket {
  raffleId: string;
  ticketNumber: number;
  /** Ya estaba impreso en el ánfora: el dueño debe sacarlo de ella. */
  printed: boolean;
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
   * Inserta tickets asignando números secuenciales, solo si el sorteo sigue ACTIVE.
   * Bloquea la fila del sorteo (SELECT FOR UPDATE): serializa contra otras emisiones, contra el
   * cierre y contra el sorteo, y evita colisiones en UNIQUE(raffleId, ticketNumber).
   * Retorna false (sin insertar) si el sorteo ya no está ACTIVE.
   */
  addTickets(raffleId: string, inputs: NewTicketInput[]): Promise<boolean>;

  deleteRaffle(id: string, tenantId: string): Promise<void>;

  findWinnersByRaffleId(raffleId: string, tenantId: string): Promise<RaffleWinner[]>;

  /**
   * Inserta un ganador y actualiza el estado del sorteo de forma atómica.
   * Bloquea la fila del sorteo y re-verifica estado y posición dentro de la transacción.
   * Lanza ConflictException si el sorteo ya no se puede sortear o la posición ya tiene ganador.
   */
  drawWinnerAtomic(id: string, tenantId: string, winner: RaffleWinner, newStatus: RaffleStatus): Promise<void>;

  /**
   * Persiste la anulación del ganador (ya marcada con `winner.void(...)`) y el nuevo estado del
   * sorteo en una sola transacción, bajo el mismo bloqueo que el sorteo.
   * Lanza ConflictException si el ganador ya estaba anulado o el sorteo ya no admite anulaciones.
   */
  voidWinnerAtomic(winner: RaffleWinner, newStatus: RaffleStatus): Promise<void>;

  // ── Spending threshold ────────────────────────────────────────────────────

  /**
   * Registra el aporte de un pedido al gasto del cliente y emite los tickets que ese gasto le
   * faltaba, todo en una transacción con el sorteo bloqueado. Es idempotente por pedido y no hace
   * nada si el sorteo ya no está ACTIVE. Retorna cuántos tickets emitió.
   */
  applyOrderSpending(input: OrderSpendingInput): Promise<number>;

  /**
   * Retira lo que un pedido cancelado otorgó: sus tickets PRODUCT_MATCH y, en los sorteos
   * SPENDING_THRESHOLD, su aporte de gasto junto con los tickets que ese gasto ya no cubre
   * (primero los aún sin imprimir, luego los más recientes). Solo actúa en sorteos ACTIVE o CLOSED.
   */
  revokeOrderTickets(tenantId: string, orderId: string): Promise<RevokedTicket[]>;

  /**
   * Marca (printed = true) o desmarca los tickets como impresos para el ánfora. Solo cambia los que
   * están en el estado contrario: repetirlo no mueve la fecha de impresión.
   */
  setTicketsPrinted(raffleId: string, ticketIds: string[], tenantId: string, printed: boolean): Promise<void>;

  /** Actualiza nombre, descripción y/o textos de premios. No toca numberOfWinners, ticketMode ni posiciones. */
  updateRaffle(
    id: string,
    tenantId: string,
    data: { name?: string; description?: string | null; prizes?: Array<{ position: number; prizeDescription: string }> },
  ): Promise<void>;
}
