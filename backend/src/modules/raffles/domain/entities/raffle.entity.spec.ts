import { Raffle } from './raffle.entity';

function makeRaffle(status: 'ACTIVE' | 'CLOSED' | 'DRAWN' = 'ACTIVE'): Raffle {
  const r = Raffle.create('tenant-1', 'Sorteo Test', 'prod-1');
  if (status === 'CLOSED') r.close();
  if (status === 'DRAWN')  { r.close(); r.draw('cust-1', 'ticket-1'); }
  return r;
}

describe('Raffle entity', () => {
  describe('create()', () => {
    it('inicia en ACTIVE con los campos correctos', () => {
      const r = Raffle.create('tenant-1', '  Sorteo Navidad  ', 'prod-1', 'desc', 'premio');
      expect(r.status).toBe('ACTIVE');
      expect(r.name).toBe('Sorteo Navidad');
      expect(r.description).toBe('desc');
      expect(r.prizeDescription).toBe('premio');
      expect(r.productId).toBe('prod-1');
      expect(r.winnerCustomerId).toBeNull();
      expect(r.winnerTicketId).toBeNull();
      expect(r.drawnAt).toBeNull();
    });

    it('recorta espacios del nombre', () => {
      const r = Raffle.create('t', '  Nombre  ', 'p');
      expect(r.name).toBe('Nombre');
    });

    it('genera un id único por instancia', () => {
      const r1 = Raffle.create('t', 'A', 'p');
      const r2 = Raffle.create('t', 'B', 'p');
      expect(r1.id).not.toBe(r2.id);
    });
  });

  describe('close()', () => {
    it('cambia el estado a CLOSED', () => {
      const r = makeRaffle('ACTIVE');
      r.close();
      expect(r.status).toBe('CLOSED');
    });
  });

  describe('reopen()', () => {
    it('vuelve de CLOSED a ACTIVE', () => {
      const r = makeRaffle('CLOSED');
      r.reopen();
      expect(r.status).toBe('ACTIVE');
    });
  });

  describe('draw()', () => {
    it('fija el ganador y cambia a DRAWN', () => {
      const r = makeRaffle('ACTIVE');
      r.draw('cust-winner', 'ticket-winner');
      expect(r.status).toBe('DRAWN');
      expect(r.winnerCustomerId).toBe('cust-winner');
      expect(r.winnerTicketId).toBe('ticket-winner');
      expect(r.drawnAt).toBeInstanceOf(Date);
    });
  });

  describe('getters', () => {
    it('isActive — true solo en ACTIVE', () => {
      expect(makeRaffle('ACTIVE').isActive).toBe(true);
      expect(makeRaffle('CLOSED').isActive).toBe(false);
      expect(makeRaffle('DRAWN').isActive).toBe(false);
    });

    it('isDrawable — true en ACTIVE y CLOSED, false en DRAWN', () => {
      expect(makeRaffle('ACTIVE').isDrawable).toBe(true);
      expect(makeRaffle('CLOSED').isDrawable).toBe(true);
      expect(makeRaffle('DRAWN').isDrawable).toBe(false);
    });

    it('isDeletable — false solo en DRAWN', () => {
      expect(makeRaffle('ACTIVE').isDeletable).toBe(true);
      expect(makeRaffle('CLOSED').isDeletable).toBe(true);
      expect(makeRaffle('DRAWN').isDeletable).toBe(false);
    });
  });
});
