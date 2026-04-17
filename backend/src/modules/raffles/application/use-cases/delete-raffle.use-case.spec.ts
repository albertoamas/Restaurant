import { BadRequestException, NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { DeleteRaffleUseCase } from './delete-raffle.use-case';
import { RaffleRepositoryPort } from '../../domain/ports/raffle-repository.port';
import { Raffle } from '../../domain/entities/raffle.entity';

function makeRaffle(status: 'ACTIVE' | 'CLOSED' | 'DRAWN' = 'ACTIVE'): Raffle {
  const r = Raffle.create('tenant-1', 'Sorteo', 'prod-1');
  if (status === 'CLOSED') r.close();
  if (status === 'DRAWN')  { r.close(); r.draw('c', 't'); }
  return r;
}

describe('DeleteRaffleUseCase', () => {
  let useCase: DeleteRaffleUseCase;
  let repo: MockProxy<RaffleRepositoryPort>;

  beforeEach(() => {
    repo    = mock<RaffleRepositoryPort>();
    useCase = new DeleteRaffleUseCase(repo);
    repo.deleteRaffle.mockResolvedValue();
  });

  it('elimina un sorteo ACTIVE', async () => {
    repo.findRaffleById.mockResolvedValue(makeRaffle('ACTIVE'));
    await useCase.execute('r1', 'tenant-1');
    expect(repo.deleteRaffle).toHaveBeenCalledWith('r1', 'tenant-1');
  });

  it('elimina un sorteo CLOSED', async () => {
    repo.findRaffleById.mockResolvedValue(makeRaffle('CLOSED'));
    await useCase.execute('r1', 'tenant-1');
    expect(repo.deleteRaffle).toHaveBeenCalledTimes(1);
  });

  it('lanza NotFoundException si no existe el sorteo', async () => {
    repo.findRaffleById.mockResolvedValue(null);
    await expect(useCase.execute('r1', 'tenant-1')).rejects.toThrow(NotFoundException);
  });

  it('lanza BadRequestException si el sorteo ya fue sorteado (DRAWN)', async () => {
    repo.findRaffleById.mockResolvedValue(makeRaffle('DRAWN'));
    await expect(useCase.execute('r1', 'tenant-1')).rejects.toThrow(BadRequestException);
    expect(repo.deleteRaffle).not.toHaveBeenCalled();
  });
});
