import { describe, it, expect } from 'vitest';
import { toBoliviaDateString, getBoliviaDayBounds } from './timezone';

describe('timezone utils', () => {
  describe('toBoliviaDateString', () => {
    it('devuelve la fecha Bolivia correcta para las 04:00 UTC (medianoche Bolivia)', () => {
      // 2026-04-11T04:00:00Z = exactamente medianoche en Bolivia (UTC-4)
      expect(toBoliviaDateString(new Date('2026-04-11T04:00:00.000Z'))).toBe('2026-04-11');
    });

    it('devuelve el día anterior para las 03:59 UTC (aún es el día anterior en Bolivia)', () => {
      // 2026-04-11T03:59:59Z = 23:59:59 del día 10 en Bolivia
      expect(toBoliviaDateString(new Date('2026-04-11T03:59:59.000Z'))).toBe('2026-04-10');
    });
  });

  describe('getBoliviaDayBounds', () => {
    it('start es medianoche Bolivia en UTC (día + 4h)', () => {
      expect(getBoliviaDayBounds('2026-04-11').start).toBe('2026-04-11T04:00:00.000Z');
    });

    it('end es 23:59:59.999 Bolivia en UTC', () => {
      expect(getBoliviaDayBounds('2026-04-11').end).toBe('2026-04-12T03:59:59.999Z');
    });

    it('el rango cubre exactamente 86399999ms (24h - 1ms)', () => {
      const { start, end } = getBoliviaDayBounds('2026-04-11');
      expect(new Date(end).getTime() - new Date(start).getTime()).toBe(86_399_999);
    });

    it('start siempre es anterior a end', () => {
      const { start, end } = getBoliviaDayBounds('2026-06-15');
      expect(new Date(start).getTime()).toBeLessThan(new Date(end).getTime());
    });
  });
});
