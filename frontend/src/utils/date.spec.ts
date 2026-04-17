import { describe, it, expect } from 'vitest';
import { formatDate, elapsed, today, formatBoliviaTime } from './date';

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

  describe('formatBoliviaTime', () => {
    it('contiene los minutos y la hora Bolivia (UTC-4): 15:30 UTC = 11:30 BOT', () => {
      const result = formatBoliviaTime('2026-04-17T15:30:00.000Z');
      // El locale puede ser 12h ("11:30 a. m.") o 24h ("11:30") — ambos deben contener "11:30"
      expect(result).toContain('11:30');
    });

    it('medianoche UTC (00:00) muestra 20:00 del día anterior en Bolivia', () => {
      // 2026-04-17T00:00Z = 2026-04-16T20:00 BOT (UTC-4)
      // En formato 12h: "08:00 p. m." — en formato 24h: "20:00"
      const result = formatBoliviaTime('2026-04-17T00:00:00.000Z');
      expect(result).toContain('8:00');
    });
  });

  describe('formatDate con timezone Bolivia', () => {
    it('aplica UTC-4 — 2026-04-17T00:00:00Z es el 16/04/2026 en Bolivia', () => {
      const result = formatDate('2026-04-17T00:00:00.000Z');
      // La fecha debe ser el 16, no el 17
      expect(result).toContain('16/04/2026');
    });
  });
});
