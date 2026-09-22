import { ForbiddenException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { PlanLimitService } from './plan-limit.service';
import { PlanRepositoryPort } from '../domain/ports/plan-repository.port';
import { Plan } from '../domain/entities/plan.entity';
import { SaasPlan } from '@pos/shared';

function makePlan(over: Partial<Plan> = {}): Plan {
  return {
    id: SaasPlan.BASICO, displayName: 'Básico', priceBs: 220,
    maxBranches: 1, maxCashiers: 2, maxProducts: 80,
    kitchenEnabled: false, rafflesEnabled: false,
    ...over,
  } as Plan;
}

describe('PlanLimitService', () => {
  let service: PlanLimitService;
  let repo: MockProxy<PlanRepositoryPort>;

  beforeEach(() => {
    repo    = mock<PlanRepositoryPort>();
    service = new PlanLimitService(repo);
  });

  describe('assertWithinLimit', () => {
    it('deja pasar cuando quedan cupos', () => {
      expect(() => service.assertWithinLimit('sucursales', makePlan(), 0)).not.toThrow();
    });

    it('lanza ForbiddenException al alcanzar el límite', () => {
      expect(() => service.assertWithinLimit('sucursales', makePlan(), 1)).toThrow(ForbiddenException);
    });

    it('-1 significa ilimitado', () => {
      const plan = makePlan({ maxProducts: -1 } as Partial<Plan>);
      expect(() => service.assertWithinLimit('productos', plan, 9999)).not.toThrow();
    });

    it('usa el singular correcto de cada recurso cuando el límite es 1', () => {
      expect(() => service.assertWithinLimit('sucursales', makePlan({ maxBranches: 1 } as Partial<Plan>), 1))
        .toThrow(/hasta 1 sucursal\./);
      expect(() => service.assertWithinLimit('cajeros', makePlan({ maxCashiers: 1 } as Partial<Plan>), 1))
        .toThrow(/hasta 1 cajero\./);
      expect(() => service.assertWithinLimit('productos', makePlan({ maxProducts: 1 } as Partial<Plan>), 1))
        .toThrow(/hasta 1 producto\./);
    });

    it('usa el plural cuando el límite es mayor a 1', () => {
      expect(() => service.assertWithinLimit('cajeros', makePlan({ maxCashiers: 2 } as Partial<Plan>), 2))
        .toThrow(/hasta 2 cajeros\./);
    });
  });
});
