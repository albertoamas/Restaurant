import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './Modal';

function renderModal(onClose = vi.fn(), children = <input aria-label="Nombre" />) {
  render(
    <>
      <button>Abrir</button>
      <Modal isOpen onClose={onClose} title="Nuevo producto">{children}</Modal>
    </>,
  );
  return onClose;
}

describe('Modal', () => {
  it('Escape lo cierra', async () => {
    const onClose = renderModal();
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('un campo interno que atiende Escape no cierra el modal', async () => {
    const onClose = renderModal(vi.fn(), (
      <input aria-label="Editar" onKeyDown={(e) => { if (e.key === 'Escape') e.preventDefault(); }} />
    ));
    screen.getByLabelText('Editar').focus();
    await userEvent.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('al abrir enfoca el primer campo del contenido, no el botón de cerrar', () => {
    renderModal();
    expect(screen.getByLabelText('Nombre')).toHaveFocus();
  });

  it('Tab no sale del modal', async () => {
    renderModal();
    const cerrar = screen.getByRole('button', { name: 'Cerrar' });
    const campo = screen.getByLabelText('Nombre');

    cerrar.focus();
    await userEvent.tab({ shift: true });
    expect(campo).toHaveFocus();

    await userEvent.tab();
    expect(cerrar).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Abrir' })).not.toHaveFocus();
  });

  it('al cerrar devuelve el foco al elemento que lo abrió', () => {
    const { rerender } = render(<button>Abrir</button>);
    const abrir = screen.getByRole('button', { name: 'Abrir' });
    abrir.focus();

    const tree = (open: boolean) => (
      <>
        <button>Abrir</button>
        <Modal isOpen={open} onClose={vi.fn()} title="X"><input aria-label="Nombre" /></Modal>
      </>
    );
    rerender(tree(true));
    expect(screen.getByLabelText('Nombre')).toHaveFocus();
    rerender(tree(false));
    expect(screen.getByRole('button', { name: 'Abrir' })).toHaveFocus();
  });
});
