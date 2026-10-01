import { OrderType } from '@pos/shared';

export const orderTypeLabels: Record<OrderType, string> = {
  [OrderType.DINE_IN]: 'Local',
  [OrderType.TAKEOUT]: 'Para llevar',
  [OrderType.DELIVERY]: 'Delivery',
};
