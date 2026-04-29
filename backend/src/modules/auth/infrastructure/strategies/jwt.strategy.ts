import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TenantRepositoryPort } from '../../../tenant/domain/ports/tenant-repository.port';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly tenantCache = new Map<string, { active: boolean; expiresAt: number }>();
  private readonly userCache   = new Map<string, { active: boolean; expiresAt: number }>();
  private readonly CACHE_TTL_MS = 60_000;

  constructor(
    configService: ConfigService,
    @Inject('TenantRepositoryPort')
    private readonly tenantRepo: TenantRepositoryPort,
    @Inject('UserRepositoryPort')
    private readonly userRepo: UserRepositoryPort,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: { sub: string; tenantId: string; branchId: string | null; role: string }) {
    const now = Date.now();

    // Verificar tenant activo (cache 60s)
    const tenantCached = this.tenantCache.get(payload.tenantId);
    if (tenantCached && tenantCached.expiresAt > now) {
      if (!tenantCached.active) throw new UnauthorizedException('Cuenta suspendida');
    } else {
      const tenant = await this.tenantRepo.findById(payload.tenantId);
      const active = !!tenant?.isActive;
      this.tenantCache.set(payload.tenantId, { active, expiresAt: now + this.CACHE_TTL_MS });
      if (!active) throw new UnauthorizedException('Cuenta suspendida');
    }

    // Verificar usuario activo (cache 60s por userId)
    const userCached = this.userCache.get(payload.sub);
    if (userCached && userCached.expiresAt > now) {
      if (!userCached.active) throw new UnauthorizedException('Usuario inactivo');
    } else {
      const user = await this.userRepo.findById(payload.sub, payload.tenantId);
      const active = !!user?.isActive;
      this.userCache.set(payload.sub, { active, expiresAt: now + this.CACHE_TTL_MS });
      if (!active) throw new UnauthorizedException('Usuario inactivo');
    }

    return {
      sub:      payload.sub,
      tenantId: payload.tenantId,
      branchId: payload.branchId ?? null,
      role:     payload.role,
    };
  }
}
