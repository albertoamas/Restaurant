import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { PaymentMethod, UserRole, OrderType, OrderStatus } from '@pos/shared';
import { RegisterOrderPaymentUseCase } from './register-order-payment.use-case';
import { OrderRepositoryPort } from '../../domain/ports/order-repository.port';
import { CashSessionRepositoryPort } from '../../../cash-session/domain/ports/cash-session-repository.port';
import { Order } from '../../domain/entities/order.entity';
import { CashSession } from '../../../cash-session/domain/entities/cash-session.entity';
import { RegisterOrderPaymentDto } from '../dto/register-order-payment.dto';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const TENANT_ID = 'tenant-1';
const BRANCH_ID = 'branch-1';
const ORDER_ID  = 'order-1';

function makeOrder(overrides: Partial<{
  status: OrderStatus;
  isPaid: boolean;
  total: number;
}>= {}): Order {
  return Order.reconstitute({
    id:            ORDER_ID,
    tenantId:      TENANT_ID,
    branchId:      BRANCH_ID,
    orderNumber:   1,
    type:          OrderType.DINE_IN,
    status:        overrides.status ?? OrderStatus.PENDING,
    paymentMethod: null,
    payments:      overrides.isPaid ? [{ id: 'pay-1', orderId: ORDER_ID, tenantId: TENANT_ID, method: PaymentMethod.QR, amount: 100 }] : [],
    items:         [{ id: 'item-1', orderId: ORDER_ID, productId: 'prod-1', productName: 'Burger', unitPrice: 100, quantity: 1, subtotal: 100 }],
    subtotal:      overrides.total ?? 100,
    total:         overrides.total ?? 100,
    notes:         null,
    createdBy:     'user-1',
    customerId:    null,
    createdAt:     new Date(),
    updatedAt:     new Date(),
  });
}

function makeDto(payments: { method: PaymentMethod; amount: number }[]): RegisterOrderPaymentDto {
  return { payments } as RegisterOrderPaymentDto;
}

function makeOpenSession(): CashSession {
  return { id: 'session-1', tenantId: TENANT_ID, branchId: BRANCH_ID, status: 'OPEN' } as CashSession;
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('RegisterOrderPaymentUseCase', () => {
  let useCase: RegisterOrderPaymentUseCase;
  let orderRepo: MockProxy<OrderRepositoryPort>;
  let cashSessionRepo: MockProxy<CashSessionRepositoryPort>;

  beforeEach(() => {
    orderRepo      = mock<OrderRepositoryPort>();
    cashSessionRepo = mock<CashSessionRepositoryPort>();
    useCase = new RegisterOrderPaymentUseCase(orderRepo, cashSessionRepo);
  });

  it('throws NotFoundException when order does not exist', async () => {
    orderRepo.findById.mockResolvedValue(null);
    await expect(
      useCase.execute(TENANT_ID, ORDER_ID, UserRole.OWNER, makeDto([{ method: PaymentMethod.QR, amount: 100 }])),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when order is CANCELLED', async () => {
    orderRepo.findById.mockResolvedValue(makeOrder({ status: OrderStatus.CANCELLED }));
    await expect(
      useCase.execute(TENANT_ID, ORDER_ID, UserRole.OWNER, makeDto([{ method: PaymentMethod.QR, amount: 100 }])),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when order is already paid', async () => {
    orderRepo.findById.mockResolvedValue(makeOrder({ isPaid: true }));
    await expect(
      useCase.execute(TENANT_ID, ORDER_ID, UserRole.OWNER, makeDto([{ method: PaymentMethod.QR, amount: 100 }])),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when payment sum does not match total', async () => {
    orderRepo.findById.mockResolvedValue(makeOrder({ total: 100 }));
    await expect(
      useCase.execute(TENANT_ID, ORDER_ID, UserRole.OWNER, makeDto([{ method: PaymentMethod.QR, amount: 50 }])),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws ForbiddenException when CASHIER tries to register CORTESIA', async () => {
    orderRepo.findById.mockResolvedValue(makeOrder({ total: 100 }));
    await expect(
      useCase.execute(TENANT_ID, ORDER_ID, UserRole.CASHIER, makeDto([{ method: PaymentMethod.CORTESIA, amount: 100 }])),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows OWNER to register CORTESIA', async () => {
    const order = makeOrder({ total: 100 });
    orderRepo.findById.mockResolvedValue(order);
    orderRepo.registerPayments.mockResolvedValue(order);
    await expect(
      useCase.execute(TENANT_ID, ORDER_ID, UserRole.OWNER, makeDto([{ method: PaymentMethod.CORTESIA, amount: 100 }])),
    ).resolves.not.toThrow();
  });

  it('throws BadRequestException when CORTESIA is combined with another method', async () => {
    orderRepo.findById.mockResolvedValue(makeOrder({ total: 100 }));
    await expect(
      useCase.execute(TENANT_ID, ORDER_ID, UserRole.OWNER,
        makeDto([{ method: PaymentMethod.CORTESIA, amount: 60 }, { method: PaymentMethod.QR, amount: 40 }]),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException for CASH payment when sessions exist but none is open', async () => {
    orderRepo.findById.mockResolvedValue(makeOrder({ total: 100 }));
    cashSessionRepo.findByBranch.mockResolvedValue([makeOpenSession()]);
    cashSessionRepo.findOpenByBranch.mockResolvedValue(null);

    await expect(
      useCase.execute(TENANT_ID, ORDER_ID, UserRole.OWNER, makeDto([{ method: PaymentMethod.CASH, amount: 100 }])),
    ).rejects.toThrow(BadRequestException);
  });

  it('allows CASH payment when a session is open', async () => {
    const order = makeOrder({ total: 100 });
    orderRepo.findById.mockResolvedValue(order);
    cashSessionRepo.findByBranch.mockResolvedValue([makeOpenSession()]);
    cashSessionRepo.findOpenByBranch.mockResolvedValue(makeOpenSession());
    orderRepo.registerPayments.mockResolvedValue(order);

    await expect(
      useCase.execute(TENANT_ID, ORDER_ID, UserRole.OWNER, makeDto([{ method: PaymentMethod.CASH, amount: 100 }])),
    ).resolves.toBe(order);
  });

  it('allows CASH payment when the branch has never opened a session', async () => {
    const order = makeOrder({ total: 100 });
    orderRepo.findById.mockResolvedValue(order);
    cashSessionRepo.findByBranch.mockResolvedValue([]);
    orderRepo.registerPayments.mockResolvedValue(order);

    await expect(
      useCase.execute(TENANT_ID, ORDER_ID, UserRole.OWNER, makeDto([{ method: PaymentMethod.CASH, amount: 100 }])),
    ).resolves.toBe(order);
  });

  it('persists payments and returns saved order on success', async () => {
    const order = makeOrder({ total: 150 });
    const savedOrder = makeOrder({ total: 150, isPaid: true });
    orderRepo.findById.mockResolvedValue(order);
    cashSessionRepo.findByBranch.mockResolvedValue([makeOpenSession()]);
    cashSessionRepo.findOpenByBranch.mockResolvedValue(makeOpenSession());
    orderRepo.registerPayments.mockResolvedValue(savedOrder);

    const result = await useCase.execute(
      TENANT_ID, ORDER_ID, UserRole.OWNER,
      makeDto([{ method: PaymentMethod.QR, amount: 100 }, { method: PaymentMethod.CASH, amount: 50 }]),
    );

    expect(orderRepo.registerPayments).toHaveBeenCalledWith(
      ORDER_ID, TENANT_ID,
      expect.arrayContaining([
        expect.objectContaining({ method: PaymentMethod.QR, amount: 100 }),
        expect.objectContaining({ method: PaymentMethod.CASH, amount: 50 }),
      ]),
      PaymentMethod.QR, // dominant method (highest amount)
    );
    expect(result).toBe(savedOrder);
  });

  it('selects dominant method as the one with the highest amount', async () => {
    const order = makeOrder({ total: 100 });
    orderRepo.findById.mockResolvedValue(order);
    cashSessionRepo.findByBranch.mockResolvedValue([makeOpenSession()]);
    cashSessionRepo.findOpenByBranch.mockResolvedValue(makeOpenSession());
    orderRepo.registerPayments.mockResolvedValue(order);

    await useCase.execute(
      TENANT_ID, ORDER_ID, UserRole.OWNER,
      makeDto([{ method: PaymentMethod.CASH, amount: 30 }, { method: PaymentMethod.QR, amount: 70 }]),
    );

    expect(orderRepo.registerPayments).toHaveBeenCalledWith(
      ORDER_ID, TENANT_ID, expect.any(Array),
      PaymentMethod.QR, // QR has the higher amount
    );
  });
});
