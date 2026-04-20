import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MODULE_FLAGS_KEY, ModuleFlag } from '../decorators/module-flags.decorator';
import { TenantRepositoryPort } from '../../modules/tenant/domain/ports/tenant-repository.port';

@Injectable()
export class ModuleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject('TenantRepositoryPort')
    private readonly tenantRepo: TenantRepositoryPort,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const flags = this.reflector.getAllAndOverride<ModuleFlag[]>(MODULE_FLAGS_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!flags?.length) return true;

    const { user } = ctx.switchToHttp().getRequest();
    const tenant = await this.tenantRepo.findById(user.tenantId);
    if (!tenant) throw new ForbiddenException('Tenant no encontrado');

    for (const flag of flags) {
      if (!tenant[flag]) {
        throw new ForbiddenException('Este módulo no está disponible en tu plan actual');
      }
    }
    return true;
  }
}
