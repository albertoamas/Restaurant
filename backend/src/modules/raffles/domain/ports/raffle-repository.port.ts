import { RaffleDetailDto, RaffleDto } from '@pos/shared';
import { Raffle, RaffleStatus } from '../entities/raffle.entity';
import { RaffleWinner } from '../entities/raffle-winner.entity';

export const RAFFLE_REPOSITORY_PORT = 'RaffleRepositoryPort';

/** Tickets que un pedido debe tener en un sorteo por producto o categorías. */
export interface ItemTicketsInput {
  tenantId: string;
  raffleId: string;
  customerId: string;
  orderId: string;
  /** Unidades del pedido que cumplen la regla del sorteo = tickets que debe tener. */
  expected: number;
}

/** Pedido que aporta gasto a un sorteo SPENDING_THRESHOLD. */
export interface OrderSpendingInput {
  tenantId: string;
  raffleId: string;
  customerId: string;
  orderId: string;
  /** Total vigente del pedido: solo se suma lo que aún no se había contado. */
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

  /**
   * Cambia el estado bajo el bloqueo del sorteo, solo si sigue en `from`. Lanza ConflictException
   * si otra operación lo movió antes (p. ej. reabrir un sorteo que acaba de registrar su primer ganador).
   */
  changeStatus(id: string, tenantId: string, from: RaffleStatus, to: RaffleStatus): Promise<void>;

  findRaffleById(id: string, tenantId: string): Promise<Raffle | null>;
  findAllRaffles(tenantId: string): Promise<RaffleDto[]>;
  findRaffleWithTickets(id: string, tenantId: string): Promise<RaffleDetailDto | null>;

  /**
   * Sorteos ACTIVE que pueden dar tickets por las líneas de un pedido: los de producto (PRODUCT_MATCH)
   * cuyo producto está en la lista y los de categorías (CATEGORY_MATCH) con alguna de esas categorías.
   * Solo los creados antes que el pedido: un pedido anterior al sorteo no participa.
   */
  findActiveItemRaffles(tenantId: string, productIds: string[], categoryIds: string[], orderCreatedAt: Date): Promise<Raffle[]>;

  /** Sorteos ACTIVE por monto creados antes que el pedido. */
  findActiveSpendingRaffles(tenantId: string, orderCreatedAt: Date): Promise<Raffle[]>;

  /** Categoría de cada producto del negocio que exista (un producto borrado no aparece). */
  findProductCategoryIds(tenantId: string, productIds: string[]): Promise<Map<string, string>>;

  /**
   * Completa los tickets del pedido en un sorteo ACTIVE hasta `expected`, con números secuenciales y
   * bajo el bloqueo del sorteo. Es idempotente: repetirlo no duplica. Retorna cuántos emitió
   * (0 si el sorteo ya no está ACTIVE o ya tenía todos).
   */
  topUpItemTickets(input: ItemTicketsInput): Promise<number>;

  deleteRaffle(id: string, tenantId: string): Promise<void>;

  findWinnersByRaffleId(raffleId: string, tenantId: string): Promise<RaffleWinner[]>;

  /** El ticket con ese número en el sorteo, o null si no existe. */
  findTicketByNumber(raffleId: string, tenantId: string, ticketNumber: number): Promise<{ id: string; customerId: string } | null>;

  /**
   * Inserta un ganador y actualiza el estado del sorteo de forma atómica.
   * Bloquea la fila del sorteo y re-verifica estado, ticket y posición dentro de la transacción.
   * Lanza ConflictException si el sorteo ya no admite ganadores, el ticket ya no existe o la posición ya tiene ganador.
   */
  addWinnerAtomic(id: string, tenantId: string, winner: RaffleWinner, newStatus: RaffleStatus): Promise<void>;

  /**
   * Persiste la anulación del ganador (ya marcada con `winner.void(...)`) y el nuevo estado del
   * sorteo en una sola transacción, bajo el mismo bloqueo que el sorteo.
   * Lanza ConflictException si el ganador ya estaba anulado o el sorteo ya no admite anulaciones.
   */
  voidWinnerAtomic(winner: RaffleWinner, newStatus: RaffleStatus): Promise<void>;

  // ── Spending threshold ────────────────────────────────────────────────────

  /**
   * Suma al gasto del cliente lo que el pedido aún no había aportado (todo el total la primera vez;
   * solo el aumento si se agregaron productos) y emite los tickets que ese gasto le faltaba, en una
   * transacción con el sorteo bloqueado. Es idempotente y no hace nada si el sorteo ya no está
   * ACTIVE. Retorna cuántos tickets emitió.
   */
  applyOrderSpending(input: OrderSpendingInput): Promise<number>;

  /**
   * Retira lo que un pedido otorgó a clientes distintos de `keepCustomerId` (null = a todos: pedido
   * cancelado, cobrado como cortesía o sin cliente): sus tickets por producto o categorías y, en los
   * sorteos por monto, su aporte de gasto junto con los tickets que ya no cubre (primero los aún
   * sin imprimir, luego los más recientes). Solo actúa en sorteos ACTIVE o CLOSED.
   */
  revokeOrderTickets(tenantId: string, orderId: string, keepCustomerId: string | null): Promise<RevokedTicket[]>;

  /**
   * Marca (printed = true) o desmarca los tickets como impresos para el ánfora. Solo cambia los que
   * están en el estado contrario: repetirlo no mueve la fecha de impresión.
   */
  setTicketsPrinted(raffleId: string, ticketIds: string[], tenantId: string, printed: boolean): Promise<void>;

  /**
   * Actualiza nombre, descripción y/o textos de premios bajo el bloqueo del sorteo. No toca
   * numberOfWinners, ticketMode ni posiciones. Lanza NotFoundException si el sorteo no existe y
   * ConflictException si algún premio es de un puesto que ya tiene ganador activo (el ganador
   * conserva el texto con que se registró).
   */
  updateRaffle(
    id: string,
    tenantId: string,
    data: { name?: string; description?: string | null; prizes?: Array<{ position: number; prizeDescription: string }> },
  ): Promise<void>;
}
