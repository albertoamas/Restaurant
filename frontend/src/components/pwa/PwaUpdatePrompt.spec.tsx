import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PwaUpdatePrompt } from './PwaUpdatePrompt';
import { useCartStore } from '../../store/cart.store';

const pwa = vi.hoisted(() => ({
  needRefresh: true,
  update: vi.fn(),
  dismiss: vi.fn(),
}));

// Se mockea el hook (no `virtual:pwa-register`), que Vitest no puede resolver sin el plugin.
vi.mock('../../hooks/usePwaUpdate', () => ({ usePwaUpdate: () => pwa }));

describe('PwaUpdatePrompt', () => {
  beforeEach(() => {
    pwa.needRefresh = true;
    pwa.update.mockClear();
    pwa.dismiss.mockClear();
    useCartStore.getState().clear();
  });

  it('no muestra nada sin versión nueva', () => {
    pwa.needRefresh = false;
    const { container } = render(<PwaUpdatePrompt />);
    expect(container).toBeEmptyDOMElement();
  });

  it('con el carrito vacío deja actualizar', async () => {
    render(<PwaUpdatePrompt />);
    await userEvent.click(screen.getByRole('button', { name: 'Actualizar' }));
    expect(pwa.update).toHaveBeenCalledTimes(1);
  });

  it('con productos en el carrito bloquea la actualización y explica por qué', () => {
    useCartStore.getState().addItem({ id: 'p1', name: 'Salteña', price: 10 });
    render(<PwaUpdatePrompt />);

    expect(screen.getByRole('button', { name: 'Actualizar' })).toBeDisabled();
    expect(screen.getByText(/se perdería el carrito/i)).toBeInTheDocument();
  });

  it('"Más tarde" oculta el aviso', async () => {
    render(<PwaUpdatePrompt />);
    await userEvent.click(screen.getByRole('button', { name: 'Más tarde' }));
    expect(pwa.dismiss).toHaveBeenCalledTimes(1);
  });
});
