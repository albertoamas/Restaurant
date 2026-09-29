import { describe, it, expect } from 'vitest';
import { formatDate, elapsed, today, formatBoliviaTime, formatBoliviaDateShort, eachDay, timeAgo, minutesBetween, durationLabel } from './date';

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

  describe('formatBoliviaDateShort', () => {
    it('devuelve día y mes abreviado', () => {
      expect(formatBoliviaDateShort('2026-04-17T15:30:00.000Z')).toMatch(/17/);
    });

    it('aplica UTC-4 — 2026-04-17T00:00:00Z cae el 16 en Bolivia', () => {
      // Sin timeZone, un navegador en UTC+ mostraría el 17: este es el bug que cubre.
      expect(formatBoliviaDateShort('2026-04-17T00:00:00.000Z')).toMatch(/16/);
    });
  });

  describe('eachDay', () => {
    it('incluye ambos extremos', () => {
      expect(eachDay('2026-09-01', '2026-09-03')).toEqual(['2026-09-01', '2026-09-02', '2026-09-03']);
    });

    it('un rango de un solo día devuelve ese día', () => {
      expect(eachDay('2026-09-01', '2026-09-01')).toEqual(['2026-09-01']);
    });

    it('cruza de mes y de año sin saltarse ni repetir días', () => {
      expect(eachDay('2026-12-30', '2027-01-02')).toEqual([
        '2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02',
      ]);
    });

    it('un rango invertido devuelve vacío, no un bucle infinito', () => {
      expect(eachDay('2026-09-05', '2026-09-01')).toEqual([]);
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

describe('tiempos en minutos', () => {
  const base = Date.parse('2026-09-29T12:00:00Z');
  const ago = (min: number) => new Date(base - min * 60_000).toISOString();

  it('timeAgo', () => {
    expect(timeAgo(ago(0.5), base)).toBe('Hace un momento');
    expect(timeAgo(ago(12), base)).toBe('Hace 12 min');
    expect(timeAgo(ago(65), base)).toBe('Hace 1 h 5 min');
    expect(timeAgo(ago(120), base)).toBe('Hace 2 h');
  });

  it('minutesBetween nunca es negativo', () => {
    expect(minutesBetween(ago(-5), base)).toBe(0);
    expect(minutesBetween(ago(18), new Date(base).toISOString())).toBe(18);
  });

  it('durationLabel', () => {
    expect(durationLabel(0)).toBe('menos de 1 min');
    expect(durationLabel(45)).toBe('45 min');
    expect(durationLabel(65)).toBe('1 h 5 min');
    expect(durationLabel(1440)).toBe('1 día');
    expect(durationLabel(2100)).toBe('1 día 11 h');
    expect(durationLabel(3000)).toBe('2 días 2 h');
  });
});
