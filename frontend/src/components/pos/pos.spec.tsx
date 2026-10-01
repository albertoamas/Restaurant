import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CategoryDto, ProductDto } from '@pos/shared';
import { CartItem } from './CartItem';
import { ProductGrid } from './ProductGrid';

const item = (quantity: number) => ({ productId: 'p1', name: 'Pique macho', price: 65, quantity });

describe('CartItem', () => {
  it('con más de una unidad, el botón izquierdo quita una unidad', async () => {
    const onDecrement = vi.fn();
    render(<CartItem item={item(2)} onIncrement={vi.fn()} onDecrement={onDecrement} />);
    await userEvent.click(screen.getByRole('button', { name: 'Quitar una unidad de Pique macho' }));
    expect(onDecrement).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Bs 130.00')).toBeInTheDocument();
  });

  it('con una unidad, el mismo botón quita el producto (sin depender de pasar el mouse)', () => {
    render(<CartItem item={item(1)} onIncrement={vi.fn()} onDecrement={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Quitar Pique macho del pedido' })).toBeVisible();
  });
});

const product = (id: string, name: string, categoryId: string, imageUrl?: string): ProductDto =>
  ({ id, name, categoryId, price: 10, imageUrl, isActive: true } as ProductDto);
const categories: CategoryDto[] = [{ id: 'c1', name: 'Platos', sortOrder: 1, isActive: true }];

describe('ProductGrid', () => {
  it('muestra cuántas unidades del producto ya están en el pedido', () => {
    render(
      <ProductGrid
        products={[product('p1', 'Silpancho', 'c1'), product('p2', 'Salteña', 'c1')]}
        onSelect={vi.fn()}
        categories={categories}
        quantities={{ p1: 3 }}
      />,
    );
    const [silpancho, saltena] = screen.getAllByTestId('product-card');
    expect(silpancho).toHaveAccessibleName(/Silpancho.*3 en el pedido/);
    expect(saltena).not.toHaveAccessibleName(/en el pedido/);
  });

  it('sin foto muestra la inicial del producto; con foto, la foto', () => {
    const { container } = render(
      <ProductGrid
        products={[product('p1', 'Silpancho', 'c1'), product('p2', 'Api', 'c1', '/uploads/api.webp')]}
        onSelect={vi.fn()}
        categories={categories}
      />,
    );
    expect(screen.getByText('S')).toBeInTheDocument();
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/uploads/api.webp');
  });

  it('sin productos explica qué hacer', () => {
    render(<ProductGrid products={[]} onSelect={vi.fn()} />);
    expect(screen.getByText('Sin productos')).toBeInTheDocument();
  });
});
