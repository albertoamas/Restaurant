import { ConflictException, NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { SOCKET_EVENTS } from '@pos/shared';
import { DeleteCustomerUseCase } from './delete-customer.use-case';
import { CustomerRepositoryPort } from '../../domain/ports/customer-repository.port';
import { Customer } from '../../domain/entities/customer.entity';
import { EventsService } from '../../../events/events.service';
import { PrismaService } from '../../../prisma/prisma.service';

const TENANT_ID = 'tenant-1';

function makeCustomer(): Customer {
  return Customer.reconstitute({
    id: 'cust-1', tenantId: TENANT_ID, name: 'Ana', phone: null, email: null, notes: null,
    createdAt: new Date(), updatedAt: new Date(),
  });
}

describe('DeleteCustomerUseCase', () => {
  let useCase: DeleteCustomerUseCase;
  let repo: MockProxy<CustomerRepositoryPort>;
  let events: MockProxy<EventsService>;
  let activeOrders: jest.Mock;

  beforeEach(() => {
    repo         = mock<CustomerRepositoryPort>();
    events       = mock<EventsService>();
    activeOrders = jest.fn().mockResolvedValue(0);
    const prisma = { order: { count: activeOrders } } as unknown as PrismaService;
    useCase = new DeleteCustomerUseCase(repo, prisma, events);

    repo.findById.mockResolvedValue(makeCustomer());
    repo.isInvolvedInRaffles.mockResolvedValue(false);
    repo.delete.mockResolvedValue();
  });

  it('lanza NotFoundException si el cliente no existe', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.execute('cust-1', TENANT_ID)).rejects.toThrow(NotFoundException);
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('no elimina a un cliente con pedidos activos', async () => {
    activeOrders.mockResolvedValue(2);

    await expect(useCase.execute('cust-1', TENANT_ID)).rejects.toThrow(ConflictException);
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('no elimina a un cliente que participa en un sorteo sin terminar o figura como ganador', async () => {
    repo.isInvolvedInRaffles.mockResolvedValue(true);

    await expect(useCase.execute('cust-1', TENANT_ID)).rejects.toThrow('participa en un sorteo');
    expect(repo.isInvolvedInRaffles).toHaveBeenCalledWith('cust-1', TENANT_ID);
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('elimina al cliente y avisa por socket cuando nada lo impide', async () => {
    await useCase.execute('cust-1', TENANT_ID);

    expect(repo.delete).toHaveBeenCalledWith('cust-1', TENANT_ID);
    expect(events.emitToTenant).toHaveBeenCalledWith(TENANT_ID, SOCKET_EVENTS.CUSTOMER_DELETED, { id: 'cust-1' });
  });
});
