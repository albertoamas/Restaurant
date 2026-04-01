import { create } from 'zustand';
import { OrderType } from '@pos/shared';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  orderType: OrderType;
  notes: string;
  addItem: (product: { id: string; name: string; price: number }) => void;
  removeItem: (productId: string) => void;
  incrementItem: (productId: string) => void;
  decrementItem: (productId: string) => void;
  setOrderType: (type: OrderType) => void;
  setNotes: (notes: string) => void;
  clear: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  orderType: OrderType.DINE_IN,
  notes: '',

  addItem: (product) =>
    set((state) => {
      const existing = state.items.find((i) => i.productId === product.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i,
          ),
        };
      }
      return { items: [...state.items, { productId: product.id, name: product.name, price: product.price, quantity: 1 }] };
    }),

  removeItem: (productId) =>
    set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),

  incrementItem: (productId) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i,
      ),
    })),

  decrementItem: (productId) =>
    set((state) => {
      const item = state.items.find((i) => i.productId === productId);
      if (item && item.quantity <= 1) {
        return { items: state.items.filter((i) => i.productId !== productId) };
      }
      return {
        items: state.items.map((i) =>
          i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i,
        ),
      };
    }),

  setOrderType: (type) => set({ orderType: type }),

  setNotes: (notes) => set({ notes }),

  clear: () => set({ items: [], orderType: OrderType.DINE_IN, notes: '' }),

  getTotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

  getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));
