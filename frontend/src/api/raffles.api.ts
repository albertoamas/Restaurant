import client from './client';
import type { RaffleDetailDto, RaffleDto, CreateRaffleRequest } from '@pos/shared';

export const rafflesApi = {
  getAll: (): Promise<RaffleDto[]> =>
    client.get<RaffleDto[]>('/api/v1/raffles').then((r) => r.data),

  getOne: (id: string): Promise<RaffleDetailDto> =>
    client.get<RaffleDetailDto>(`/api/v1/raffles/${id}`).then((r) => r.data),

  create: (data: CreateRaffleRequest): Promise<RaffleDto> =>
    client.post<RaffleDto>('/api/v1/raffles', data).then((r) => r.data),

  close: (id: string): Promise<RaffleDetailDto> =>
    client.patch<RaffleDetailDto>(`/api/v1/raffles/${id}/close`, {}).then((r) => r.data),

  draw: (id: string): Promise<RaffleDetailDto> =>
    client.post<RaffleDetailDto>(`/api/v1/raffles/${id}/draw`).then((r) => r.data),

  delete: (id: string): Promise<void> =>
    client.delete(`/api/v1/raffles/${id}`).then(() => {}),

  reopen: (id: string): Promise<RaffleDetailDto> =>
    client.patch<RaffleDetailDto>(`/api/v1/raffles/${id}/reopen`, {}).then((r) => r.data),

  voidWinner: (raffleId: string, winnerId: string): Promise<RaffleDetailDto> =>
    client.patch<RaffleDetailDto>(`/api/v1/raffles/${raffleId}/winners/${winnerId}/void`, {}).then((r) => r.data),
};
