import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { isUnlimited } from '@pos/shared';
import { TenantRepositoryPort } from '../../modules/tenant/domain/ports/tenant-repository.port';
import { PlanRepositoryPort } from '../../modules/plans/domain/ports/plan-repository.port';
import { getBoliviaDayBoundsISO, toBoliviaDateString } from '../utils/timezone.util';

/**
 * Limita qué tan atrás puede consultar un tenant según `plan.reportHistoryDays`.
 *
 * Rechaza con un mensaje explícito en vez de recortar el rango en silencio: un
 * reporte que vuelve vacío o recortado se lee como un bug, no como un límite
 * del plan.
 */
@Injectable()
export class ReportHistoryGuard implements CanActivate {
  constructor(
    @Inject('TenantRepositoryPort')
    private readonly tenantRepo: TenantRepositoryPort,
    @Inject('PlanRepositoryPort')
    private readonly planRepo: PlanRepositoryPort,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const requested: unknown = req.query?.from ?? req.query?.date;
    if (!requested || typeof requested !== 'string') return true; // sin fecha explícita el use-case usa hoy

    // Una fecha ilegible no es un problema de plan: se deja pasar para que la
    // validación del endpoint responda 400 y no un 403 que confunde al cliente.
    const requestedAt = new Date(requested).getTime();
    if (Number.isNaN(requestedAt)) return true;

    const tenant = await this.tenantRepo.findById(req.user.tenantId);
    if (!tenant) throw new ForbiddenException('Tenant no encontrado');

    const plan = await this.planRepo.findById(tenant.plan);
    if (!plan || isUnlimited(plan.reportHistoryDays)) return true;

    const earliest = this.earliestAllowed(plan.reportHistoryDays);
    if (requestedAt >= new Date(earliest).getTime()) return true;

    throw new ForbiddenException(
      `Tu plan ${plan.displayName} permite consultar los últimos ${plan.reportHistoryDays} días. ` +
      `Contacta al administrador para acceder al historial completo.`,
    );
  }

  /** Inicio (en UTC) del día Bolivia más antiguo que el plan permite consultar. */
  private earliestAllowed(historyDays: number): string {
    const limit = new Date();
    limit.setUTCDate(limit.getUTCDate() - historyDays);
    return getBoliviaDayBoundsISO(toBoliviaDateString(limit)).start;
  }
}
