import { Raffle } from './raffle.entity';

const PRIZES_1 = [{ position: 1, prizeDescription: '1er lugar' }];
const PRIZES_3 = [
  { position: 1, prizeDescription: '1er lugar' },
  { position: 2, prizeDescription: '2do lugar' },
  { position: 3, prizeDescription: '3er lugar' },
];

function makeRaffle(status: 'ACTIVE' | 'CLOSED' | 'DRAWING' | 'DRAWN' = 'ACTIVE'): Raffle {
  const r = Raffle.create({
    tenantId: 'tenant-1', name: 'Sorteo Test', ticketMode: 'PRODUCT_MATCH',
    productId: 'prod-1', spendingThreshold: null, numberOfWinners: 1, prizes: PRIZES_1,
  });
  if (status === 'CLOSED')  { r.close(); }
  if (status === 'DRAWING') { r.close(); r.startDrawing(); }
  if (status === 'DRAWN')   { r.close(); r.finishDrawing(); }
  return r;
}

describe('Raffle entity', () => {
  describe('create()', () => {
    it('inicia en ACTIVE con los campos correctos', () => {
      const r = Raffle.create({
        tenantId: 'tenant-1', name: '  Sorteo Navidad  ', description: 'desc',
        ticketMode: 'PRODUCT_MATCH', productId: 'prod-1', spendingThreshold: null,
        numberOfWinners: 1, prizes: PRIZES_1,
      });
      expect(r.status).toBe('ACTIVE');
      expect(r.name).toBe('Sorteo Navidad');
      expect(r.description).toBe('desc');
      expect(r.numberOfWinners).toBe(1);
      expect(r.prizes).toEqual(PRIZES_1);
      expect(r.productId).toBe('prod-1');
      expect(r.ticketMode).toBe('PRODUCT_MATCH');
      expect(r.spendingThreshold).toBeNull();
    });

    it('recorta espacios del nombre', () => {
      const r = Raffle.create({
        tenantId: 't', name: '  Nombre  ', ticketMode: 'PRODUCT_MATCH',
        productId: 'p', spendingThreshold: null, numberOfWinners: 1, prizes: PRIZES_1,
      });
      expect(r.name).toBe('Nombre');
    });

    it('genera un id único por instancia', () => {
      const opts = { tenantId: 't', ticketMode: 'PRODUCT_MATCH' as const, productId: 'p', spendingThreshold: null, numberOfWinners: 1, prizes: PRIZES_1 };
      const r1 = Raffle.create({ ...opts, name: 'A' });
      const r2 = Raffle.create({ ...opts, name: 'B' });
      expect(r1.id).not.toBe(r2.id);
    });

    it('description vacía o ausente queda como null', () => {
      const base = { tenantId: 't', name: 'A', ticketMode: 'PRODUCT_MATCH' as const, productId: 'p', spendingThreshold: null, numberOfWinners: 1, prizes: PRIZES_1 };
      const r1 = Raffle.create({ ...base, description: '' });
      const r2 = Raffle.create({ ...base });
      expect(r1.description).toBeNull();
      expect(r2.description).toBeNull();
    });

    it('admite múltiples ganadores y sus premios', () => {
      const r = Raffle.create({
        tenantId: 't', name: 'Multi', ticketMode: 'PRODUCT_MATCH',
        productId: 'p', spendingThreshold: null, numberOfWinners: 3, prizes: PRIZES_3,
      });
      expect(r.numberOfWinners).toBe(3);
      expect(r.prizes).toHaveLength(3);
    });

    it('asigna createdAt y updatedAt al momento de creación', () => {
      const before = new Date();
      const r = Raffle.create({
        tenantId: 't', name: 'A', ticketMode: 'PRODUCT_MATCH',
        productId: 'p', spendingThreshold: null, numberOfWinners: 1, prizes: PRIZES_1,
      });
      const after = new Date();
      expect(r.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(r.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(r.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it('modo SPENDING_THRESHOLD guarda el umbral y productId null', () => {
      const r = Raffle.create({
        tenantId: 't', name: 'Acumulativo', ticketMode: 'SPENDING_THRESHOLD',
        productId: null, spendingThreshold: 100, numberOfWinners: 1, prizes: PRIZES_1,
      });
      expect(r.ticketMode).toBe('SPENDING_THRESHOLD');
      expect(r.spendingThreshold).toBe(100);
      expect(r.productId).toBeNull();
    });
  });

  describe('close()', () => {
    it('cambia el estado a CLOSED', () => {
      const r = makeRaffle('ACTIVE');
      r.close();
      expect(r.status).toBe('CLOSED');
    });

    it('actualiza updatedAt al cerrar', () => {
      const r = makeRaffle('ACTIVE');
      const before = r.updatedAt;
      r.close();
      expect(r.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });
  });

  describe('reopen()', () => {
    it('vuelve de CLOSED a ACTIVE', () => {
      const r = makeRaffle('CLOSED');
      r.reopen();
      expect(r.status).toBe('ACTIVE');
    });

    it('actualiza updatedAt al reabrir', () => {
      const r = makeRaffle('CLOSED');
      const before = r.updatedAt;
      r.reopen();
      expect(r.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });
  });

  describe('startDrawing() / finishDrawing()', () => {
    it('startDrawing transiciona a DRAWING', () => {
      const r = makeRaffle('ACTIVE');
      r.startDrawing();
      expect(r.status).toBe('DRAWING');
    });

    it('finishDrawing transiciona a DRAWN', () => {
      const r = makeRaffle('DRAWING');
      r.finishDrawing();
      expect(r.status).toBe('DRAWN');
    });

    it('startDrawing actualiza updatedAt', () => {
      const r = makeRaffle('ACTIVE');
      const before = r.updatedAt;
      r.startDrawing();
      expect(r.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it('finishDrawing actualiza updatedAt', () => {
      const r = makeRaffle('DRAWING');
      const before = r.updatedAt;
      r.finishDrawing();
      expect(r.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });
  });

  describe('backToDrawing()', () => {
    it('transiciona de DRAWN a DRAWING', () => {
      const r = makeRaffle('DRAWN');
      r.backToDrawing();
      expect(r.status).toBe('DRAWING');
    });

    it('actualiza updatedAt al volver a DRAWING', () => {
      const r = makeRaffle('DRAWN');
      const before = r.updatedAt;
      r.backToDrawing();
      expect(r.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });
  });

  describe('getters', () => {
    it('isActive — true solo en ACTIVE', () => {
      expect(makeRaffle('ACTIVE').isActive).toBe(true);
      expect(makeRaffle('CLOSED').isActive).toBe(false);
      expect(makeRaffle('DRAWING').isActive).toBe(false);
      expect(makeRaffle('DRAWN').isActive).toBe(false);
    });

    it('isDrawable — true en ACTIVE, CLOSED y DRAWING; false en DRAWN', () => {
      expect(makeRaffle('ACTIVE').isDrawable).toBe(true);
      expect(makeRaffle('CLOSED').isDrawable).toBe(true);
      expect(makeRaffle('DRAWING').isDrawable).toBe(true);
      expect(makeRaffle('DRAWN').isDrawable).toBe(false);
    });

    it('isDeletable — false en DRAWING y DRAWN, true en ACTIVE y CLOSED', () => {
      expect(makeRaffle('ACTIVE').isDeletable).toBe(true);
      expect(makeRaffle('CLOSED').isDeletable).toBe(true);
      expect(makeRaffle('DRAWING').isDeletable).toBe(false);
      expect(makeRaffle('DRAWN').isDeletable).toBe(false);
    });

    it('isReopenable — true solo en CLOSED', () => {
      expect(makeRaffle('ACTIVE').isReopenable).toBe(false);
      expect(makeRaffle('CLOSED').isReopenable).toBe(true);
      expect(makeRaffle('DRAWING').isReopenable).toBe(false);
      expect(makeRaffle('DRAWN').isReopenable).toBe(false);
    });
  });
});
