import {
  toBoliviaDateString,
  getBoliviaDayBoundsISO,
  getBoliviaTodayBoundsISO,
} from './timezone.util';

describe('timezone.util', () => {
  describe('toBoliviaDateString', () => {
    it('devuelve la fecha Bolivia correcta para medianoche Bolivia (04:00 UTC)', () => {
      // 2026-04-11T04:00:00Z = medianoche en Bolivia (UTC-4)
      const result = toBoliviaDateString(new Date('2026-04-11T04:00:00.000Z'));
      expect(result).toBe('2026-04-11');
    });

    it('devuelve el día anterior para las 03:59 UTC (aún es el día anterior en Bolivia)', () => {
      // 2026-04-11T03:59:59Z = 23:59:59 del día 10 en Bolivia
      const result = toBoliviaDateString(new Date('2026-04-11T03:59:59.000Z'));
      expect(result).toBe('2026-04-10');
    });

    it('formato devuelto siempre es YYYY-MM-DD', () => {
      const result = toBoliviaDateString(new Date('2026-01-05T12:00:00.000Z'));
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('getBoliviaDayBoundsISO', () => {
    it('start es medianoche Bolivia expresada en UTC (+4h)', () => {
      const { start } = getBoliviaDayBoundsISO('2026-04-11');
      expect(start).toBe('2026-04-11T04:00:00.000Z');
    });

    it('end es 23:59:59.999 Bolivia expresado en UTC (+4h)', () => {
      const { end } = getBoliviaDayBoundsISO('2026-04-11');
      expect(end).toBe('2026-04-12T03:59:59.999Z');
    });

    it('start siempre es anterior a end', () => {
      const { start, end } = getBoliviaDayBoundsISO('2026-04-11');
      expect(new Date(start).getTime()).toBeLessThan(new Date(end).getTime());
    });

    it('el rango cubre exactamente 86399999ms (24h - 1ms)', () => {
      const { start, end } = getBoliviaDayBoundsISO('2026-04-11');
      const diff = new Date(end).getTime() - new Date(start).getTime();
      expect(diff).toBe(86_399_999);
    });
  });

  describe('getBoliviaTodayBoundsISO', () => {
    it('no lanza excepción y devuelve un rango válido', () => {
      expect(() => getBoliviaTodayBoundsISO()).not.toThrow();
      const { start, end } = getBoliviaTodayBoundsISO();
      expect(new Date(start).getTime()).toBeLessThan(new Date(end).getTime());
    });
  });
});
