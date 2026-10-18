import { describe, it, expect } from 'vitest';
import { buildRaffleSummaryHtml, escapeHtml } from './print';

describe('escapeHtml', () => {
  it('escapa & → &amp;', () => {
    expect(escapeHtml('Sal & Pimienta')).toBe('Sal &amp; Pimienta');
  });

  it('escapa < → &lt;', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
  });

  it('escapa > → &gt;', () => {
    expect(escapeHtml('a > b')).toBe('a &gt; b');
  });

  it('escapa " → &quot;', () => {
    expect(escapeHtml('"hola"')).toBe('&quot;hola&quot;');
  });

  it("escapa ' → &#39;", () => {
    expect(escapeHtml("O'Brien")).toBe('O&#39;Brien');
  });

  it('no modifica strings sin caracteres especiales', () => {
    expect(escapeHtml('Hamburguesa Clásica 50 Bs')).toBe('Hamburguesa Clásica 50 Bs');
  });
});

describe('buildRaffleSummaryHtml', () => {
  const settings = { businessName: 'La Esquina', businessAddress: 'Av. Siempre Viva 123', businessPhone: '70000000' };
  const info = { customerName: 'Ana Pérez', raffleName: 'Gran sorteo', ticketNumbers: [1, 2, 3, 4, 10, 11] };

  it('lista todos los tickets del cliente en rangos y su total', () => {
    const html = buildRaffleSummaryHtml(info, settings);
    expect(html).toContain('#1 al #4, #10 y #11');
    expect(html).toContain('6 tickets');
    expect(html).toContain('Ana Pérez');
    expect(html).toContain('Gran sorteo');
    expect(html).toContain('La Esquina');
  });

  it('usa el singular con un solo ticket', () => {
    expect(buildRaffleSummaryHtml({ ...info, ticketNumbers: [7] }, settings)).toContain('1 ticket<');
  });

  it('indica cuánto falta para el próximo ticket solo si se informa', () => {
    expect(buildRaffleSummaryHtml(info, settings)).not.toContain('próximo ticket');
    expect(buildRaffleSummaryHtml({ ...info, remainingForNext: 35 }, settings)).toContain('Te faltan Bs 35.00 para tu próximo ticket');
  });

  it('escapa el HTML de los nombres', () => {
    const html = buildRaffleSummaryHtml({ ...info, customerName: '<b>Ana</b>' }, settings);
    expect(html).not.toContain('<b>Ana</b>');
    expect(html).toContain('&lt;b&gt;Ana&lt;/b&gt;');
  });
});
