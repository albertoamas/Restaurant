/**
 * Canonical socket event names emitted by the backend.
 * Both backend (emit) and frontend (subscribe) MUST use these constants to avoid typos.
 *
 * Adding a new event:
 *   1. Add the entry below.
 *   2. Emit it from the backend use case via `eventsService.emitToTenant(tenantId, SOCKET_EVENTS.X, payload)`.
 *   3. Subscribe to it from the frontend via `useSocketEvent(SOCKET_EVENTS.X, handler)`.
 */
export const SOCKET_EVENTS = {
  // Orders
  ORDER_CREATED:        'order.created',
  ORDER_UPDATED:        'order.updated',

  // Cash sessions
  CASH_OPENED:          'cash.opened',
  CASH_CLOSED:          'cash.closed',

  // Catalog
  PRODUCT_CREATED:      'product.created',
  PRODUCT_UPDATED:      'product.updated',
  PRODUCT_DELETED:      'product.deleted',
  CATEGORY_CREATED:     'category.created',
  CATEGORY_UPDATED:     'category.updated',
  CATEGORY_DELETED:     'category.deleted',

  // Customers
  CUSTOMER_CREATED:     'customer.created',
  CUSTOMER_UPDATED:     'customer.updated',
  CUSTOMER_DELETED:     'customer.deleted',

  // Expenses
  EXPENSE_CREATED:      'expense.created',
  EXPENSE_UPDATED:      'expense.updated',
  EXPENSE_DELETED:      'expense.deleted',

  // Expense catalog (categorías y gastos predefinidos)
  EXPENSE_CATEGORY_CREATED: 'expense_category.created',
  EXPENSE_CATEGORY_UPDATED: 'expense_category.updated',
  EXPENSE_CATEGORY_DELETED: 'expense_category.deleted',
  EXPENSE_CONCEPT_CREATED:  'expense_concept.created',
  EXPENSE_CONCEPT_UPDATED:  'expense_concept.updated',
  EXPENSE_CONCEPT_DELETED:  'expense_concept.deleted',

  // Raffles
  RAFFLE_CREATED:       'raffle.created',
  RAFFLE_UPDATED:       'raffle.updated',
  RAFFLE_DELETED:       'raffle.deleted',
  RAFFLE_TICKET_ADDED:  'raffle.ticket_added',

  // Tenant settings (broadcast)
  TENANT_MODULES_UPDATED: 'tenant.modules.updated',
} as const;

export type SocketEventName = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];
