import { SaasPlan } from '@pos/shared';
import { PlanModulesService } from './plan-modules.service';
import { Plan } from '../domain/entities/plan.entity';

function basico(): Plan {
  // maxBranches 1, sin equipo, sin cocina, sin sorteos
  return new Plan(SaasPlan.BASICO, 'Básico', 220, 1, 2, 80, false, false, false, false, 90, 100);
}

function pro(): Plan {
  return new Plan(SaasPlan.PRO, 'Pro', 399, 3, 8, -1, true, true, true, true, 365, 1024);
}

describe('PlanModulesService', () => {
  let service: PlanModulesService;

  beforeEach(() => {
    service = new PlanModulesService();
  });

  describe('baseModules', () => {
    it('BASICO: núcleo activo, todo lo vendible apagado', () => {
      expect(service.baseModules(basico())).toEqual({
        ordersEnabled:   true,
        cashEnabled:     true,
        branchesEnabled: false, // maxBranches = 1, la pantalla no aporta nada
        teamEnabled:     false,
        kitchenEnabled:  false,
        rafflesEnabled:  false,
      });
    });

    it('PRO: habilita lo que el plan incluye', () => {
      expect(service.baseModules(pro())).toEqual({
        ordersEnabled:   true,
        cashEnabled:     true,
        branchesEnabled: true,
        teamEnabled:     true,
        kitchenEnabled:  true,
        rafflesEnabled:  true,
      });
    });

    it('branchesEnabled se deriva del límite: ilimitado también lo habilita', () => {
      const negocio = new Plan(SaasPlan.NEGOCIO, 'Negocio', 790, -1, -1, -1, true, true, true, true, -1, 5120);
      expect(service.baseModules(negocio).branchesEnabled).toBe(true);
    });
  });

  describe('resolveModules', () => {
    it('sin overrides devuelve exactamente lo del plan', () => {
      expect(service.resolveModules(basico(), null)).toEqual(service.baseModules(basico()));
    });

    it('un override enciende un módulo que el plan no da (cortesía)', () => {
      const result = service.resolveModules(basico(), { rafflesEnabled: true });
      expect(result.rafflesEnabled).toBe(true);
      expect(result.kitchenEnabled).toBe(false); // lo demás sigue al plan
    });

    it('un override también puede apagar algo que el plan sí da', () => {
      const result = service.resolveModules(pro(), { kitchenEnabled: false });
      expect(result.kitchenEnabled).toBe(false);
      expect(result.rafflesEnabled).toBe(true);
    });

    it('permite apagar el núcleo como interruptor de emergencia', () => {
      expect(service.resolveModules(pro(), { ordersEnabled: false }).ordersEnabled).toBe(false);
    });

    it('ignora claves desconocidas o no booleanas', () => {
      const overrides = { rafflesEnabled: undefined, noExiste: true } as never;
      expect(service.resolveModules(basico(), overrides)).toEqual(service.baseModules(basico()));
    });
  });

  describe('pruneOverrides', () => {
    it('descarta las excepciones que el plan ya cubre', () => {
      // Si no se podaran, al subir de plan quedarían redundantes y al bajar
      // volverían a imponerse aunque el admin nunca las pidió para ese plan.
      expect(service.pruneOverrides(pro(), { kitchenEnabled: true, rafflesEnabled: true })).toEqual({});
    });

    it('conserva las que siguen difiriendo del plan', () => {
      expect(service.pruneOverrides(basico(), { rafflesEnabled: true, kitchenEnabled: false }))
        .toEqual({ rafflesEnabled: true });
    });

    it('null devuelve un objeto vacío', () => {
      expect(service.pruneOverrides(basico(), null)).toEqual({});
    });
  });

  describe('mergeOverrides', () => {
    it('guarda como excepción lo que difiere del plan', () => {
      const result = service.mergeOverrides(basico(), null, { rafflesEnabled: true });
      expect(result).toEqual({ rafflesEnabled: true });
    });

    it('borra la excepción cuando el valor vuelve a coincidir con el plan', () => {
      // Así ese módulo vuelve a seguir al plan en futuros cambios, en vez de
      // quedar congelado para siempre en el valor que el admin puso una vez.
      const result = service.mergeOverrides(basico(), { rafflesEnabled: true }, { rafflesEnabled: false });
      expect(result).toEqual({});
    });

    it('conserva las excepciones que el cambio no menciona', () => {
      const result = service.mergeOverrides(
        basico(),
        { rafflesEnabled: true, teamEnabled: true },
        { kitchenEnabled: true },
      );
      expect(result).toEqual({ rafflesEnabled: true, teamEnabled: true, kitchenEnabled: true });
    });

    it('un cambio que coincide con el plan no crea una excepción nueva', () => {
      const result = service.mergeOverrides(pro(), null, { kitchenEnabled: true });
      expect(result).toEqual({});
    });
  });
});
