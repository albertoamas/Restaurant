import { Inject, Injectable } from '@nestjs/common';
import { TenantRepositoryPort } from '../../domain/ports/tenant-repository.port';
import { Tenant } from '../../domain/entities/tenant.entity';
import { UpdateTenantSettingsDto } from '../dto/update-tenant-settings.dto';

@Injectable()
export class UpdateTenantSettingsUseCase {
  constructor(
    @Inject('TenantRepositoryPort')
    private readonly tenantRepo: TenantRepositoryPort,
  ) {}

  execute(tenantId: string, dto: UpdateTenantSettingsDto): Promise<Tenant> {
    return this.tenantRepo.updateSettings(tenantId, dto);
  }
}
