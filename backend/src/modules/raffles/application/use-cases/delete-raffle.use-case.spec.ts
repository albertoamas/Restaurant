import { BadRequestException, NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { DeleteRaffleUseCase } from './delete-raffle.use-case';
import { RaffleRepositoryPort } from '../../domain/ports/raffle-repository.port';
import { Raffle } from '../../domain/entities/raffle.entity';

const PRIZES = [{ position: 1, prizeDescription: 'Premio' }];

function makeRaffle(status: 'ACTIVE' | 'CLOSED' | 'DRAWING' | 'DRAWN' = 'ACTIVE'): Raffle {
  const r = Raffle.create('tenant-1', 'Sorteo', 'prod-1', 1, PRIZES);
  if (status === 'CLOSED')  r.close();
  if (status === 'DRAWING') { r.close(); r.startDrawing(); }
  if (status === 'DRAWN')   { r.close(); r.finishDrawing(); }
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

  it('elimina un sorteo ACTIVE y pasa id + tenantId al repositorio', async () => {
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
    expect(repo.deleteRaffle).not.toHaveBeenCalled();
  });

  it('lanza BadRequestException si el sorteo está DRAWING', async () => {
    repo.findRaffleById.mockResolvedValue(makeRaffle('DRAWING'));
    await expect(useCase.execute('r1', 'tenant-1')).rejects.toThrow(BadRequestException);
    expect(repo.deleteRaffle).not.toHaveBeenCalled();
  });

  it('lanza BadRequestException si el sorteo ya fue sorteado (DRAWN)', async () => {
    repo.findRaffleById.mockResolvedValue(makeRaffle('DRAWN'));
    await expect(useCase.execute('r1', 'tenant-1')).rejects.toThrow(BadRequestException);
    expect(repo.deleteRaffle).not.toHaveBeenCalled();
  });
});
