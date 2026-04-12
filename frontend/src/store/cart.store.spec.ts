import { describe, it, expect, beforeEach } from 'vitest';
import { OrderType } from '@pos/shared';
import { useCartStore } from './cart.store';

// Reset store between tests
beforeEach(() => {
  useCartStore.getState().clear();
});

const PRODUCT_A = { id: 'prod-a', name: 'Hamburguesa', price: 50 };
const PRODUCT_B = { id: 'prod-b', name: 'Papas Fritas', price: 25 };

describe('useCartStore', () => {
  it('estado inicial tiene items vacío', () => {
    expect(useCartStore.getState().items).toEqual([]);
  });

  it('addItem agrega un item nuevo', () => {
    useCartStore.getState().addItem(PRODUCT_A);
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].productId).toBe('prod-a');
    expect(useCartStore.getState().items[0].quantity).toBe(1);
  });

  it('addItem con el mismo productId incrementa quantity en lugar de duplicar', () => {
    useCartStore.getState().addItem(PRODUCT_A);
    useCartStore.getState().addItem(PRODUCT_A);
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
  });

  it('removeItem elimina el item correcto', () => {
    useCartStore.getState().addItem(PRODUCT_A);
    useCartStore.getState().addItem(PRODUCT_B);
    useCartStore.getState().removeItem('prod-a');
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe('prod-b');
  });

  it('incrementItem sube la cantidad en 1', () => {
    useCartStore.getState().addItem(PRODUCT_A);
    useCartStore.getState().incrementItem('prod-a');
    expect(useCartStore.getState().items[0].quantity).toBe(2);
  });

  it('decrementItem baja la cantidad en 1', () => {
    useCartStore.getState().addItem(PRODUCT_A);
    useCartStore.getState().incrementItem('prod-a'); // qty = 2
    useCartStore.getState().decrementItem('prod-a');  // qty = 1
    expect(useCartStore.getState().items[0].quantity).toBe(1);
  });

  it('decrementItem cuando quantity = 1 elimina el item', () => {
    useCartStore.getState().addItem(PRODUCT_A);
    useCartStore.getState().decrementItem('prod-a');
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('setOrderType cambia el tipo de pedido', () => {
    useCartStore.getState().setOrderType(OrderType.TAKEOUT);
    expect(useCartStore.getState().orderType).toBe(OrderType.TAKEOUT);
  });

  it('clear vacía el carrito y resetea el tipo', () => {
    useCartStore.getState().addItem(PRODUCT_A);
    useCartStore.getState().setOrderType(OrderType.DELIVERY);
    useCartStore.getState().clear();
    expect(useCartStore.getState().items).toHaveLength(0);
    expect(useCartStore.getState().orderType).toBe(OrderType.DINE_IN);
  });

  it('getTotal() calcula sum(quantity * price) correctamente', () => {
    useCartStore.getState().addItem(PRODUCT_A); // 50
    useCartStore.getState().addItem(PRODUCT_B); // 25
    useCartStore.getState().incrementItem('prod-a'); // 50 × 2 = 100
    // total = 100 + 25 = 125
    expect(useCartStore.getState().getTotal()).toBe(125);
  });
});
