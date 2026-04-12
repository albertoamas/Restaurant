import { describe, it, expect } from 'vitest';
import { formatDate, elapsed, today } from './date';

describe('date utils', () => {
  describe('formatDate', () => {
    it('devuelve una string con día, mes, año, hora y minuto', () => {
      const result = formatDate('2026-04-11T14:30:00.000Z');
      // Verifica que contiene los componentes esperados (formato es-BO)
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/); // dd/mm/yyyy
      expect(result).toMatch(/\d{2}:\d{2}/);           // hh:mm
    });
  });

  describe('elapsed', () => {
    it('devuelve "Xs" cuando han pasado menos de 60 segundos', () => {
      const createdAt = new Date(Date.now() - 30_000).toISOString(); // hace 30s
      expect(elapsed(createdAt)).toMatch(/^\d+s$/);
    });

    it('devuelve "Xm Ys" cuando han pasado 60 segundos o más', () => {
      const createdAt = new Date(Date.now() - 90_000).toISOString(); // hace 1m 30s
      expect(elapsed(createdAt)).toMatch(/^\d+m \d+s$/);
    });
  });

  describe('today', () => {
    it('devuelve una string en formato YYYY-MM-DD', () => {
      expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
