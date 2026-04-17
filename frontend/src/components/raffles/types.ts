import type { RaffleDto, RaffleTicketDto } from '@pos/shared';

export type DetailRaffle = RaffleDto & { tickets: RaffleTicketDto[] };
