import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { isUnlimited } from '@pos/shared';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { TenantRepositoryPort } from '../../tenant/domain/ports/tenant-repository.port';
import { PlanRepositoryPort } from '../../plans/domain/ports/plan-repository.port';

const MB = 1024 * 1024;

/**
 * Cuota de imágenes por tenant, según `plan.maxStorageMb`.
 *
 * El uso se mide recorriendo la carpeta del tenant en vez de llevar un contador
 * en la BD: así borrar un archivo libera cuota solo, sin nada que mantener
 * sincronizado. Con pocas decenas de imágenes por negocio el costo es
 * despreciable y solo ocurre al subir.
 *
 * LIMITACIÓN CONOCIDA: las imágenes subidas antes de que existiera el prefijo
 * por tenant viven planas en `uploads/` y no se pueden atribuir a nadie, así que
 * no cuentan para la cuota. Se decidió no moverlas: sus URLs están guardadas en
 * `Product.imageUrl` y `Tenant.logoUrl`, y reescribirlas tocaría archivos vivos
 * de producción. El volumen existente es mínimo y la cuota funciona de acá en
 * adelante.
 */
@Injectable()
export class StorageQuotaService {
  constructor(
    @Inject('TenantRepositoryPort')
    private readonly tenantRepo: TenantRepositoryPort,
    @Inject('PlanRepositoryPort')
    private readonly planRepo: PlanRepositoryPort,
  ) {}

  /** Carpeta donde viven las imágenes de un tenant. */
  tenantDir(tenantId: string): string {
    return join(process.cwd(), 'uploads', tenantId);
  }

  /** Bytes ocupados hoy por ese tenant. 0 si todavía no subió nada. */
  async usedBytes(tenantId: string): Promise<number> {
    const dir = this.tenantDir(tenantId);
    let names: string[];
    try {
      names = await readdir(dir);
    } catch {
      return 0; // carpeta inexistente = sin uso
    }

    const sizes = await Promise.all(
      names.map(async (name) => {
        try {
          return (await stat(join(dir, name))).size;
        } catch {
          return 0; // borrado entre el readdir y el stat
        }
      }),
    );
    return sizes.reduce((acc, size) => acc + size, 0);
  }

  /** Lanza si subir `incomingBytes` dejaría al tenant por encima de su plan. */
  async assertFits(tenantId: string, incomingBytes: number): Promise<void> {
    const tenant = await this.tenantRepo.findById(tenantId);
    if (!tenant) throw new ForbiddenException('Tenant no encontrado');

    const plan = await this.planRepo.findById(tenant.plan);
    if (!plan || isUnlimited(plan.maxStorageMb)) return;

    const limitBytes = plan.maxStorageMb * MB;
    const used = await this.usedBytes(tenantId);

    if (used + incomingBytes > limitBytes) {
      throw new ForbiddenException(
        // No se sugiere "borrá imágenes": hoy no hay forma de borrarlas desde
        // la app, y reemplazar la foto de un producto no libera la anterior.
        // Cuando exista esa pantalla, este mensaje debe mencionarla.
        `Tu plan ${plan.displayName} incluye ${plan.maxStorageMb} MB de imágenes y ya usaste ` +
        `${Math.round(used / MB)} MB. Contacta al administrador para ampliar tu plan.`,
      );
    }
  }
}
