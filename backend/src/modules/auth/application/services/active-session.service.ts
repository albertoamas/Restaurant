import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { TenantRepositoryPort } from '../../../tenant/domain/ports/tenant-repository.port';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';

export interface TokenPayload {
  sub: string;
  tenantId: string;
  branchId: string | null;
  role: string;
}

/**
 * Valida que la sesión de un token siga viva: negocio y usuario activos, y resuelve la
 * sucursal actual del usuario desde la BD (no del token: reasignar a un cajero debe surtir
 * efecto sin re-login). La usan `JwtStrategy` (HTTP) y `EventsGateway` (socket).
 *
 * Caché de 60 s por negocio y por usuario. Quien desactive un usuario, suspenda un negocio o
 * reasigne una sucursal llama a `forgetUser` / `forgetTenant` para que surta efecto al instante.
 */
@Injectable()
export class ActiveSessionService {
  private readonly tenantCache = new Map<string, { active: boolean; expiresAt: number }>();
  private readonly userCache   = new Map<string, { active: boolean; branchId: string | null; expiresAt: number }>();
  private readonly CACHE_TTL_MS = 60_000;

  constructor(
    @Inject('TenantRepositoryPort')
    private readonly tenantRepo: TenantRepositoryPort,
    @Inject('UserRepositoryPort')
    private readonly userRepo: UserRepositoryPort,
  ) {}

  async resolve(payload: TokenPayload): Promise<TokenPayload> {
    const now = Date.now();

    let tenantCached = this.tenantCache.get(payload.tenantId);
    if (!tenantCached || tenantCached.expiresAt <= now) {
      const tenant = await this.tenantRepo.findById(payload.tenantId);
      tenantCached = { active: !!tenant?.isActive, expiresAt: now + this.CACHE_TTL_MS };
      this.tenantCache.set(payload.tenantId, tenantCached);
    }
    if (!tenantCached.active) throw new UnauthorizedException('Cuenta suspendida');

    let userCached = this.userCache.get(payload.sub);
    if (!userCached || userCached.expiresAt <= now) {
      const user = await this.userRepo.findById(payload.sub, payload.tenantId);
      userCached = {
        active:    !!user?.isActive,
        branchId:  user?.branchId ?? null,
        expiresAt: now + this.CACHE_TTL_MS,
      };
      this.userCache.set(payload.sub, userCached);
    }
    if (!userCached.active) throw new UnauthorizedException('Usuario inactivo');

    return {
      sub:      payload.sub,
      tenantId: payload.tenantId,
      branchId: userCached.branchId,
      role:     payload.role,
    };
  }

  forgetUser(userId: string): void {
    this.userCache.delete(userId);
  }

  forgetTenant(tenantId: string): void {
    this.tenantCache.delete(tenantId);
  }
}
