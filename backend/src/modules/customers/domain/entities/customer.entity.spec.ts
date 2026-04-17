import { Customer } from './customer.entity';

describe('Customer entity', () => {
  describe('create()', () => {
    it('crea un cliente con los campos correctos', () => {
      const c = Customer.create({ tenantId: 'tenant-1', name: '  Juan  ', phone: '71234567' });
      expect(c.name).toBe('Juan');
      expect(c.phone).toBe('71234567');
      expect(c.tenantId).toBe('tenant-1');
      expect(c.id).toBeTruthy();
    });

    it('convierte strings vacíos de phone/email a null', () => {
      const c = Customer.create({ tenantId: 't', name: 'Ana', phone: '', email: '  ' });
      expect(c.phone).toBeNull();
      expect(c.email).toBeNull();
    });

    it('genera un id único por instancia', () => {
      const c1 = Customer.create({ tenantId: 't', name: 'A' });
      const c2 = Customer.create({ tenantId: 't', name: 'B' });
      expect(c1.id).not.toBe(c2.id);
    });
  });

  describe('update()', () => {
    it('actualiza nombre, teléfono, email y notas', () => {
      const c = Customer.create({ tenantId: 't', name: 'Ana' });
      c.update({ name: 'Ana García', phone: '79999999', email: 'ana@mail.com', notes: 'VIP' });
      expect(c.name).toBe('Ana García');
      expect(c.phone).toBe('79999999');
      expect(c.email).toBe('ana@mail.com');
      expect(c.notes).toBe('VIP');
    });

    it('no modifica campos no incluidos en el patch', () => {
      const c = Customer.create({ tenantId: 't', name: 'Pedro', phone: '70000000' });
      c.update({ name: 'Pedro Nuevo' });
      expect(c.phone).toBe('70000000');
    });

    it('permite limpiar phone a null con string vacío', () => {
      const c = Customer.create({ tenantId: 't', name: 'X', phone: '70000000' });
      c.update({ phone: '' });
      expect(c.phone).toBeNull();
    });
  });
});
