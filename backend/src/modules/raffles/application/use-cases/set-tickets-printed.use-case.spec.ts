import { NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { SOCKET_EVENTS } from '@pos/shared';
import { SetTicketsPrintedUseCase } from './set-tickets-printed.use-case';
import { RaffleRepositoryPort } from '../../domain/ports/raffle-repository.port';
import { Raffle } from '../../domain/entities/raffle.entity';
import { EventsService } from '../../../events/events.service';

const RAFFLE = Raffle.create({
  tenantId: 'tenant-1', name: 'Sorteo', ticketMode: 'PRODUCT_MATCH', productId: 'prod-1',
  spendingThreshold: null, numberOfWinners: 1, prizes: [{ position: 1, prizeDescription: 'P' }],
});

describe('SetTicketsPrintedUseCase', () => {
  let useCase: SetTicketsPrintedUseCase;
  let repo: MockProxy<RaffleRepositoryPort>;
  let events: MockProxy<EventsService>;

  beforeEach(() => {
    repo    = mock<RaffleRepositoryPort>();
    events  = mock<EventsService>();
    useCase = new SetTicketsPrintedUseCase(repo, events);
    repo.findRaffleById.mockResolvedValue(RAFFLE);
    repo.setTicketsPrinted.mockResolvedValue();
  });

  it('lanza NotFoundException si no existe el sorteo y no escribe nada', async () => {
    repo.findRaffleById.mockResolvedValue(null);

    await expect(useCase.execute('r1', ['t1'], true, 'tenant-1')).rejects.toThrow(NotFoundException);
    expect(repo.setTicketsPrinted).not.toHaveBeenCalled();
    expect(events.emitToOwners).not.toHaveBeenCalled();
  });

  it.each([true, false])('marca los tickets con printed=%s y avisa a los dueños', async (printed) => {
    await useCase.execute('r1', ['t1', 't2'], printed, 'tenant-1');

    expect(repo.setTicketsPrinted).toHaveBeenCalledWith('r1', ['t1', 't2'], 'tenant-1', printed);
    expect(events.emitToOwners).toHaveBeenCalledWith('tenant-1', SOCKET_EVENTS.RAFFLE_PRINT_CHANGED, { raffleId: 'r1' });
  });
});
