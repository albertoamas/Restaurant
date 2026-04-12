import { BadRequestException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { OrderType, PaymentMethod, OrderNumberResetPeriod, SaasPlan } from '@pos/shared';
import { CreateOrderUseCase } from './create-order.use-case';
import { OrderRepositoryPort } from '../../domain/ports/order-repository.port';
import { BranchRepositoryPort } from '../../../branch/domain/ports/branch-repository.port';
import { ProductRepositoryPort } from '../../../catalog/domain/ports/product-repository.port';
import { CashSessionRepositoryPort } from '../../../cash-session/domain/ports/cash-session-repository.port';
import { TenantRepositoryPort } from '../../../tenant/domain/ports/tenant-repository.port';
import { CustomerRepositoryPort } from '../../../customers/domain/ports/customer-repository.port';
import { EventsService } from '../../../events/events.service';
import { Product } from '../../../catalog/domain/entities/product.entity';
import { Branch } from '../../../branch/domain/entities/branch.entity';
import { Tenant } from '../../../tenant/domain/entities/tenant.entity';
import { Order } from '../../domain/entities/order.entity';
import { CreateOrderDto } from '../dto/create-order.dto';

// ── Fixtures ──────────────────────��───────────────────────��───────────────────

const TENANT_ID = 'tenant-abc';
const BRANCH_ID = 'branch-abc';
const USER_ID   = 'user-abc';
const PRODUCT_ID = 'prod-abc';

function makeProduct(price = 50): Product {
  return Product.reconstitute({
    id:         PRODUCT_ID,
    tenantId:   TENANT_ID,
    categoryId: 'cat-1',
    name:       'Hamburguesa Clásica',
    price,
    imageUrl:   null,
    isActive:   true,
    createdAt:  new Date(),
  });
}

function makeBranch(): Branch {
  return { id: BRANCH_ID, tenantId: TENANT_ID, name: 'Centro' } as Branch;
}

function makeTenant(): Tenant {
  return new Tenant(
    TENANT_ID, 'HamBurgos', 'hamburgos', true, new Date(),
    SaasPlan.BASICO, true, true, true, true, true,
    OrderNumberResetPeriod.DAILY, null,
  );
}

function makeDto(overrides: Partial<CreateOrderDto> = {}): CreateOrderDto {
  return {
    type:     OrderType.DINE_IN,
    items:    [{ productId: PRODUCT_ID, quantity: 2 }],
    payments: [{ method: PaymentMethod.QR, amount: 100 }],
    ...overrides,
  } as CreateOrderDto;
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('CreateOrderUseCase', () => {
  let useCase: CreateOrderUseCase;
  let orderRepo: MockProxy<OrderRepositoryPort>;
  let branchRepo: MockProxy<BranchRepositoryPort>;
  let productRepo: MockProxy<ProductRepositoryPort>;
  let cashSessionRepo: MockProxy<CashSessionRepositoryPort>;
  let tenantRepo: MockProxy<TenantRepositoryPort>;
  let customerRepo: MockProxy<CustomerRepositoryPort>;
  let eventsService: MockProxy<EventsService>;

  beforeEach(() => {
    orderRepo       = mock<OrderRepositoryPort>();
    branchRepo      = mock<BranchRepositoryPort>();
    productRepo     = mock<ProductRepositoryPort>();
    cashSessionRepo = mock<CashSessionRepositoryPort>();
    tenantRepo      = mock<TenantRepositoryPort>();
    customerRepo    = mock<CustomerRepositoryPort>();
    eventsService   = mock<EventsService>();

    useCase = new CreateOrderUseCase(
      orderRepo, branchRepo, productRepo, cashSessionRepo, tenantRepo,
      customerRepo, eventsService,
    );

    // Happy-path defaults
    branchRepo.findById.mockResolvedValue(makeBranch());
    productRepo.findByIds.mockResolvedValue([makeProduct(50)]);
    cashSessionRepo.findByBranch.mockResolvedValue([]);
    tenantRepo.findById.mockResolvedValue(makeTenant());
    orderRepo.getNextOrderNumber.mockResolvedValue(1);
    orderRepo.save.mockImplementation(async (o) => o);
  });

  it('crea una orden exitosamente con pago único', async () => {
    const order = await useCase.execute(TENANT_ID, BRANCH_ID, USER_ID, makeDto());
    expect(order).toBeInstanceOf(Order);
    expect(order.total).toBe(100); // 2 × 50
    expect(order.orderNumber).toBe(1);
  });

  it('crea una orden con split payment (dos métodos que suman el total)', async () => {
    const dto = makeDto({
      payments: [
        { method: PaymentMethod.CASH, amount: 50 },
        { method: PaymentMethod.QR,   amount: 50 },
      ],
    });
    // Sin sesión de caja previa → cash no requiere sesión abierta
    cashSessionRepo.findByBranch.mockResolvedValue([]);
    const order = await useCase.execute(TENANT_ID, BRANCH_ID, USER_ID, dto);
    expect(order.payments).toHaveLength(2);
  });

  it('lanza BadRequestException si la sucursal no existe', async () => {
    branchRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute(TENANT_ID, BRANCH_ID, USER_ID, makeDto()))
      .rejects.toThrow(BadRequestException);
  });

  it('lanza BadRequestException si un producto no existe en el tenant', async () => {
    productRepo.findByIds.mockResolvedValue([]); // ninguno encontrado
    await expect(useCase.execute(TENANT_ID, BRANCH_ID, USER_ID, makeDto()))
      .rejects.toThrow(BadRequestException);
  });

  it('lanza BadRequestException si la suma de pagos no cuadra con el total (fuera de ±0.01)', async () => {
    const dto = makeDto({ payments: [{ method: PaymentMethod.QR, amount: 50 }] }); // total es 100
    await expect(useCase.execute(TENANT_ID, BRANCH_ID, USER_ID, dto))
      .rejects.toThrow(BadRequestException);
  });

  it('acepta diferencia dentro de la tolerancia ±0.01 (redondeo de decimales)', async () => {
    // qty=1, precio=10: total = 10.00. Pago 10.009 → rounds to 10.01, diff = 0.01 ≤ 0.01 → OK
    productRepo.findByIds.mockResolvedValue([makeProduct(10)]);
    const dto = makeDto({
      items:    [{ productId: PRODUCT_ID, quantity: 1 }],
      payments: [{ method: PaymentMethod.QR, amount: 10.009 }],
    });
    await expect(useCase.execute(TENANT_ID, BRANCH_ID, USER_ID, dto)).resolves.toBeDefined();
  });

  it('lanza BadRequestException si hay pago CASH y existe sesión pero está cerrada', async () => {
    // Rama tiene historial de caja (anySessions.length > 0), pero no hay sesión abierta
    cashSessionRepo.findByBranch.mockResolvedValue([{ id: 'old-session' } as any]);
    cashSessionRepo.findOpenByBranch.mockResolvedValue(null);
    const dto = makeDto({ payments: [{ method: PaymentMethod.CASH, amount: 100 }] });
    await expect(useCase.execute(TENANT_ID, BRANCH_ID, USER_ID, dto))
      .rejects.toThrow(BadRequestException);
  });

  it('crea cliente automáticamente si se pasa createCustomer con teléfono nuevo', async () => {
    customerRepo.findByPhone.mockResolvedValue(null);
    customerRepo.save.mockImplementation(async (c) => c);
    const dto = makeDto({ createCustomer: { name: 'Juan Pérez', phone: '71234567' } });
    const order = await useCase.execute(TENANT_ID, BRANCH_ID, USER_ID, dto);
    expect(customerRepo.save).toHaveBeenCalledTimes(1);
    expect(order.customerId).toBeTruthy();
  });

  it('reutiliza cliente existente si el teléfono ya existe en el tenant', async () => {
    const existingCustomer = { id: 'cust-existing', tenantId: TENANT_ID } as any;
    customerRepo.findByPhone.mockResolvedValue(existingCustomer);
    const dto = makeDto({ createCustomer: { name: 'Juan Pérez', phone: '71234567' } });
    const order = await useCase.execute(TENANT_ID, BRANCH_ID, USER_ID, dto);
    expect(customerRepo.save).not.toHaveBeenCalled();
    expect(order.customerId).toBe('cust-existing');
  });

  it('asigna el orderNumber devuelto por el repositorio', async () => {
    orderRepo.getNextOrderNumber.mockResolvedValue(42);
    const order = await useCase.execute(TENANT_ID, BRANCH_ID, USER_ID, makeDto());
    expect(order.orderNumber).toBe(42);
  });

  it('captura el precio del producto en el momento del pedido (snapshot)', async () => {
    productRepo.findByIds.mockResolvedValue([makeProduct(99)]);
    const dto = makeDto({ payments: [{ method: PaymentMethod.QR, amount: 198 }] });
    const order = await useCase.execute(TENANT_ID, BRANCH_ID, USER_ID, dto);
    expect(order.items[0].unitPrice).toBe(99);
    expect(order.total).toBe(198);
  });
});
