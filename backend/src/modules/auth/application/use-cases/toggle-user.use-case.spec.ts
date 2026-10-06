import { BadRequestException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { UserRole } from '@pos/shared';
import { ToggleUserUseCase } from './toggle-user.use-case';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { ActiveSessionService } from '../services/active-session.service';
import { EventsService } from '../../../events/events.service';
import { User } from '../../domain/entities/user.entity';

function makeUser(isActive: boolean): User {
  const u = new User();
  Object.assign(u, { id: 'u1', tenantId: 't1', branchId: null, email: 'c@demo.com', passwordHash: 'h', name: 'Caja', role: UserRole.CASHIER, isActive, createdAt: new Date() });
  return u;
}

describe('ToggleUserUseCase', () => {
  let useCase: ToggleUserUseCase;
  let repo: MockProxy<UserRepositoryPort>;
  let activeSession: MockProxy<ActiveSessionService>;
  let events: MockProxy<EventsService>;

  beforeEach(() => {
    repo          = mock<UserRepositoryPort>();
    activeSession = mock<ActiveSessionService>();
    events        = mock<EventsService>();
    useCase       = new ToggleUserUseCase(repo, activeSession, events);
    repo.save.mockImplementation(async (u) => u);
  });

  it('al desactivar, borra la caché y corta sus sockets', async () => {
    repo.findById.mockResolvedValue(makeUser(true));
    const result = await useCase.execute('u1', 't1', 'owner');
    expect(result.isActive).toBe(false);
    expect(activeSession.forgetUser).toHaveBeenCalledWith('u1');
    expect(events.disconnectUser).toHaveBeenCalledWith('u1');
  });

  it('al reactivar, borra la caché pero no corta nada', async () => {
    repo.findById.mockResolvedValue(makeUser(false));
    await useCase.execute('u1', 't1', 'owner');
    expect(activeSession.forgetUser).toHaveBeenCalledWith('u1');
    expect(events.disconnectUser).not.toHaveBeenCalled();
  });

  it('no permite desactivarse a sí mismo', async () => {
    repo.findById.mockResolvedValue(makeUser(true));
    await expect(useCase.execute('u1', 't1', 'u1')).rejects.toThrow(BadRequestException);
    expect(events.disconnectUser).not.toHaveBeenCalled();
  });
});
