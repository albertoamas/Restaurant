import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RaffleWinnerDto } from '@pos/shared';

vi.mock('./raffle-utils', () => ({
  positionLabel: (pos: number) => `${pos}° lugar`,
}));

vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn() },
}));

import { printWinnerCertificate } from './raffle-certificate';

function makeWinner(overrides: Partial<RaffleWinnerDto & { customerName: string; customerPhone?: string | null }> = {}): RaffleWinnerDto {
  return {
    id: 'w1',
    position: 1,
    prizeDescription: 'Premio de prueba',
    customerId: 'c1',
    customer: {
      id: 'c1',
      name: overrides.customerName ?? 'Juan Pérez',
      phone: overrides.customerPhone ?? null,
    },
    ticketId: 't1',
    ticketNumber: 42,
    drawnAt: new Date('2026-01-15T14:00:00Z').toISOString(),
    voided: false,
    ...Object.fromEntries(
      Object.entries(overrides).filter(([k]) => !['customerName', 'customerPhone'].includes(k)),
    ),
  };
}

describe('printWinnerCertificate — escape HTML (XSS prevention)', () => {
  let capturedHtml: string;

  beforeEach(() => {
    capturedHtml = '';
    vi.spyOn(window, 'open').mockReturnValue({
      document: {
        write: (html: string) => { capturedHtml += html; },
        close: vi.fn(),
      },
    } as unknown as Window);
  });

  it('escapa < > en el nombre del ganador', () => {
    printWinnerCertificate(
      makeWinner({ customerName: '<script>alert("xss")</script>' }),
      'Rifa Test',
      { name: 'Negocio' },
    );
    expect(capturedHtml).not.toContain('<script>alert(');
    expect(capturedHtml).toContain('&lt;script&gt;alert');
  });

  it('escapa & en el nombre del sorteo', () => {
    printWinnerCertificate(
      makeWinner(),
      'Rifa & Premios <Especiales>',
      { name: 'Negocio' },
    );
    expect(capturedHtml).toContain('&amp;');
    expect(capturedHtml).toContain('&lt;Especiales&gt;');
    expect(capturedHtml).not.toContain('Rifa & Premios <Especiales>');
  });

  it('escapa < > & en el nombre del negocio', () => {
    printWinnerCertificate(
      makeWinner(),
      'Rifa',
      { name: '<Evil Corp> & Co' },
    );
    expect(capturedHtml).toContain('&lt;Evil Corp&gt;');
    expect(capturedHtml).toContain('&amp; Co');
    expect(capturedHtml).not.toContain('<Evil Corp>');
  });

  it('escapa el teléfono del ganador cuando contiene caracteres especiales', () => {
    printWinnerCertificate(
      makeWinner({ customerPhone: '<b>123-456</b>' }),
      'Rifa',
      { name: 'Negocio' },
    );
    expect(capturedHtml).toContain('&lt;b&gt;123-456&lt;/b&gt;');
    expect(capturedHtml).not.toContain('<b>123-456</b>');
  });

  it('no renderiza el teléfono si es null', () => {
    printWinnerCertificate(
      makeWinner({ customerPhone: null }),
      'Rifa',
      { name: 'Negocio' },
    );
    expect(capturedHtml).not.toContain('winner-phone');
  });

  it('muestra toast si window.open retorna null (popup bloqueado)', async () => {
    vi.spyOn(window, 'open').mockReturnValue(null);
    const toast = (await import('react-hot-toast')).default;
    printWinnerCertificate(makeWinner(), 'Rifa', { name: 'Negocio' });
    expect(toast.error).toHaveBeenCalled();
  });
});
