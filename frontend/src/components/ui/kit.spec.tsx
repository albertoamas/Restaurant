import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SegmentedControl } from './SegmentedControl';
import { Input, Select, Textarea } from './Input';

function Segmented({ onChange = vi.fn() }: { onChange?: (v: string) => void }) {
  const [value, setValue] = useState('all');
  return (
    <SegmentedControl
      label="Estado"
      value={value}
      onChange={(v) => { setValue(v); onChange(v); }}
      options={[{ value: 'all', label: 'Todos' }, { value: 'pending', label: 'Pendientes', count: 4 }, { value: 'done', label: 'Entregados' }]}
    />
  );
}

describe('SegmentedControl', () => {
  it('se anuncia como grupo de opciones con la elegida marcada', () => {
    render(<Segmented />);
    expect(screen.getByRole('radiogroup', { name: 'Estado' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Todos' })).toHaveAttribute('aria-checked', 'true');
  });

  it('las flechas cambian la opción y mueven el foco (con vuelta al inicio)', async () => {
    const onChange = vi.fn();
    render(<Segmented onChange={onChange} />);
    screen.getByRole('radio', { name: 'Todos' }).focus();

    await userEvent.keyboard('{ArrowLeft}');
    expect(onChange).toHaveBeenLastCalledWith('done');
    expect(screen.getByRole('radio', { name: 'Entregados' })).toHaveFocus();

    await userEvent.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenLastCalledWith('all');
  });

  it('solo la opción elegida entra en el orden de Tab', () => {
    render(<Segmented />);
    expect(screen.getByRole('radio', { name: 'Todos' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('radio', { name: /Pendientes/ })).toHaveAttribute('tabindex', '-1');
  });
});

describe('campos del kit', () => {
  it('cada campo queda asociado a su etiqueta', () => {
    render(
      <>
        <Input label="Nombre" />
        <Select label="Categoría"><option>Bebidas</option></Select>
        <Textarea label="Notas" />
      </>,
    );
    expect(screen.getByLabelText('Nombre').tagName).toBe('INPUT');
    expect(screen.getByLabelText('Categoría').tagName).toBe('SELECT');
    expect(screen.getByLabelText('Notas').tagName).toBe('TEXTAREA');
  });

  it('el error se anuncia y se vincula al campo', () => {
    render(<Input label="Correo" error="Ingresa un correo válido" />);
    const input = screen.getByLabelText('Correo');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Ingresa un correo válido');
  });
});
