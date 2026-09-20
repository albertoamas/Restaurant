import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RaffleWinnerDto } from '@pos/shared';

vi.mock('./raffle-utils', () => ({
  positionLabel: (pos: number) => `${pos}° lugar`,
}));

vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn() },
}));

import { buildWinnerCertificateHtml, printWinnerCertificate } from './raffle-certificate';

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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('escapa < > en el nombre del ganador', () => {
    const html = buildWinnerCertificateHtml(
      makeWinner({ customerName: '<script>alert("xss")</script>' }),
      'Rifa Test',
      { name: 'Negocio' },
    );
    expect(html).not.toContain('<script>alert(');
    expect(html).toContain('&lt;script&gt;alert');
  });

  it('escapa & en el nombre del sorteo', () => {
    const html = buildWinnerCertificateHtml(
      makeWinner(),
      'Rifa & Premios <Especiales>',
      { name: 'Negocio' },
    );
    expect(html).toContain('&amp;');
    expect(html).toContain('&lt;Especiales&gt;');
    expect(html).not.toContain('Rifa & Premios <Especiales>');
  });

  it('escapa < > & en el nombre del negocio', () => {
    const html = buildWinnerCertificateHtml(
      makeWinner(),
      'Rifa',
      { name: '<Evil Corp> & Co' },
    );
    expect(html).toContain('&lt;Evil Corp&gt;');
    expect(html).toContain('&amp; Co');
    expect(html).not.toContain('<Evil Corp>');
  });

  it('escapa la descripción del premio cuando contiene caracteres especiales', () => {
    const html = buildWinnerCertificateHtml(
      makeWinner({ prizeDescription: '<b>Premio especial</b>' }),
      'Rifa',
      { name: 'Negocio' },
    );
    expect(html).toContain('&lt;b&gt;Premio especial&lt;/b&gt;');
    expect(html).not.toContain('<b>Premio especial</b>');
  });

  it('escapa la dirección del negocio', () => {
    const html = buildWinnerCertificateHtml(
      makeWinner(),
      'Rifa',
      { name: 'Negocio', address: '<img src=x onerror=alert(1)>' },
    );
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).not.toContain('<img src=x onerror=alert(1)>');
  });

  it('muestra toast si window.open retorna null (popup bloqueado)', async () => {
    vi.spyOn(window, 'open').mockReturnValue(null);
    const toast = (await import('react-hot-toast')).default;
    printWinnerCertificate(makeWinner(), 'Rifa', { name: 'Negocio' });
    expect(toast.error).toHaveBeenCalled();
  });
});
