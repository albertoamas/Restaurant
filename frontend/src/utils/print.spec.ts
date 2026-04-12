import { describe, it, expect } from 'vitest';
import { escapeHtml } from './print';

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
