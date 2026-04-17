import client from './client';
import type { RaffleDto, RaffleTicketDto, CreateRaffleRequest } from '@pos/shared';

export const rafflesApi = {
  getAll: (): Promise<RaffleDto[]> =>
    client.get<RaffleDto[]>('/api/v1/raffles').then((r) => r.data),

  getOne: (id: string): Promise<RaffleDto & { tickets: RaffleTicketDto[] }> =>
    client.get<RaffleDto & { tickets: RaffleTicketDto[] }>(`/api/v1/raffles/${id}`).then((r) => r.data),

  create: (data: CreateRaffleRequest): Promise<RaffleDto> =>
    client.post<RaffleDto>('/api/v1/raffles', data).then((r) => r.data),

  close: (id: string): Promise<RaffleDto> =>
    client.patch<RaffleDto>(`/api/v1/raffles/${id}/close`, {}).then((r) => r.data),

  draw: (id: string): Promise<RaffleDto & { tickets: RaffleTicketDto[] }> =>
    client.post<RaffleDto & { tickets: RaffleTicketDto[] }>(`/api/v1/raffles/${id}/draw`).then((r) => r.data),

  delete: (id: string): Promise<void> =>
    client.delete(`/api/v1/raffles/${id}`).then(() => {}),

  reopen: (id: string): Promise<RaffleDto> =>
    client.patch<RaffleDto>(`/api/v1/raffles/${id}/reopen`, {}).then((r) => r.data),
};
