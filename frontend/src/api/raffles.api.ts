import client from './client';
import type { RaffleDetailDto, RaffleDto, CreateRaffleRequest, RegisterWinnerRequest, SetTicketsPrintedRequest, UpdateRaffleRequest, VoidWinnerRequest } from '@pos/shared';

export const rafflesApi = {
  getAll: (): Promise<RaffleDto[]> =>
    client.get<RaffleDto[]>('/api/v1/raffles').then((r) => r.data),

  getOne: (id: string): Promise<RaffleDetailDto> =>
    client.get<RaffleDetailDto>(`/api/v1/raffles/${id}`).then((r) => r.data),

  create: (data: CreateRaffleRequest): Promise<RaffleDto> =>
    client.post<RaffleDto>('/api/v1/raffles', data).then((r) => r.data),

  close: (id: string): Promise<RaffleDetailDto> =>
    client.patch<RaffleDetailDto>(`/api/v1/raffles/${id}/close`, {}).then((r) => r.data),

  registerWinner: (id: string, ticketNumber: number): Promise<RaffleDetailDto> =>
    client.post<RaffleDetailDto>(`/api/v1/raffles/${id}/winners`, { ticketNumber } satisfies RegisterWinnerRequest).then((r) => r.data),

  delete: (id: string): Promise<void> =>
    client.delete(`/api/v1/raffles/${id}`).then(() => {}),

  reopen: (id: string): Promise<RaffleDetailDto> =>
    client.patch<RaffleDetailDto>(`/api/v1/raffles/${id}/reopen`, {}).then((r) => r.data),

  voidWinner: (raffleId: string, winnerId: string, data: VoidWinnerRequest): Promise<RaffleDetailDto> =>
    client.patch<RaffleDetailDto>(`/api/v1/raffles/${raffleId}/winners/${winnerId}/void`, data).then((r) => r.data),

  setTicketsPrinted: (raffleId: string, ticketIds: string[], printed: boolean): Promise<void> =>
    client.patch<void>(`/api/v1/raffles/${raffleId}/tickets/printed`, { ticketIds, printed } satisfies SetTicketsPrintedRequest).then(() => {}),

  update: (id: string, data: UpdateRaffleRequest): Promise<RaffleDetailDto> =>
    client.patch<RaffleDetailDto>(`/api/v1/raffles/${id}`, data).then((r) => r.data),
};
