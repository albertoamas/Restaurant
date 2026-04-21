import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TenantRepositoryPort } from '../../../tenant/domain/ports/tenant-repository.port';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly activeCache = new Map<string, { active: boolean; expiresAt: number }>();
  private readonly CACHE_TTL_MS = 60_000;

  constructor(
    configService: ConfigService,
    @Inject('TenantRepositoryPort')
    private readonly tenantRepo: TenantRepositoryPort,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: { sub: string; tenantId: string; branchId: string | null; role: string }) {
    const now = Date.now();
    const cached = this.activeCache.get(payload.tenantId);
    if (cached && cached.expiresAt > now) {
      if (!cached.active) throw new UnauthorizedException('Cuenta suspendida');
    } else {
      const tenant = await this.tenantRepo.findById(payload.tenantId);
      const active = !!tenant?.isActive;
      this.activeCache.set(payload.tenantId, { active, expiresAt: now + this.CACHE_TTL_MS });
      if (!active) throw new UnauthorizedException('Cuenta suspendida');
    }
    return {
      sub:      payload.sub,
      tenantId: payload.tenantId,
      branchId: payload.branchId ?? null,
      role:     payload.role,
    };
  }
}
