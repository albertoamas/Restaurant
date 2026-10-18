import { NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { SOCKET_EVENTS } from '@pos/shared';
import { DeliverTicketsUseCase } from './deliver-tickets.use-case';
import { UndeliverTicketsUseCase } from './undeliver-tickets.use-case';
import { RaffleRepositoryPort } from '../../domain/ports/raffle-repository.port';
import { Raffle } from '../../domain/entities/raffle.entity';
import { EventsService } from '../../../events/events.service';

const RAFFLE = Raffle.create({
  tenantId: 'tenant-1', name: 'Sorteo', ticketMode: 'PRODUCT_MATCH', productId: 'prod-1',
  spendingThreshold: null, numberOfWinners: 1, prizes: [{ position: 1, prizeDescription: 'P' }],
});

describe.each([
  ['DeliverTicketsUseCase', DeliverTicketsUseCase, 'deliverTickets'],
  ['UndeliverTicketsUseCase', UndeliverTicketsUseCase, 'undeliverTickets'],
] as const)('%s', (_name, UseCase, repoMethod) => {
  let useCase: InstanceType<typeof UseCase>;
  let repo: MockProxy<RaffleRepositoryPort>;
  let events: MockProxy<EventsService>;

  beforeEach(() => {
    repo    = mock<RaffleRepositoryPort>();
    events  = mock<EventsService>();
    useCase = new UseCase(repo, events);
    repo.findRaffleById.mockResolvedValue(RAFFLE);
  });

  it('lanza NotFoundException si no existe el sorteo y no escribe nada', async () => {
    repo.findRaffleById.mockResolvedValue(null);

    await expect(useCase.execute('r1', ['t1'], 'tenant-1')).rejects.toThrow(NotFoundException);
    expect(repo[repoMethod]).not.toHaveBeenCalled();
    expect(events.emitToOwners).not.toHaveBeenCalled();
  });

  it('actualiza los tickets del sorteo y avisa a los dueños para que otras sesiones se actualicen', async () => {
    await useCase.execute('r1', ['t1', 't2'], 'tenant-1');

    expect(repo[repoMethod]).toHaveBeenCalledWith('r1', ['t1', 't2'], 'tenant-1');
    expect(events.emitToOwners).toHaveBeenCalledWith('tenant-1', SOCKET_EVENTS.RAFFLE_DELIVERY_CHANGED, { raffleId: 'r1' });
  });
});
