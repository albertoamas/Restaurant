export enum UserRole {
  OWNER = 'OWNER',
  CASHIER = 'CASHIER',
}

export enum OrderType {
  DINE_IN = 'DINE_IN',
  TAKEOUT = 'TAKEOUT',
  DELIVERY = 'DELIVERY',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  QR = 'QR',
  TRANSFER = 'TRANSFER',
  CORTESIA = 'CORTESIA',
}

export enum CashSessionStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export enum OrderNumberResetPeriod {
  DAILY   = 'DAILY',
  MONTHLY = 'MONTHLY',
}

export enum SaasPlan {
  BASICO  = 'BASICO',
  PRO     = 'PRO',
  NEGOCIO = 'NEGOCIO',
}

export enum ExpenseCategory {
  SUPPLIES    = 'SUPPLIES',     // Insumos / Ingredientes
  WAGES       = 'WAGES',        // Personal / Sueldos
  UTILITIES   = 'UTILITIES',    // Servicios (luz, agua, gas)
  TRANSPORT   = 'TRANSPORT',    // Transporte
  MAINTENANCE = 'MAINTENANCE',  // Mantenimiento
  OTHER       = 'OTHER',        // Otro
}
