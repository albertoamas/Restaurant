import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Branch } from '../../domain/entities/branch.entity';
import { BranchRepositoryPort } from '../../domain/ports/branch-repository.port';

/**
 * Regla única de "¿esta sucursal es usable por este tenant?".
 *
 * El OWNER manda `branchId` en el body/query (su JWT lo lleva en null), así que
 * todo caso de uso que escriba datos de sucursal debe validarlo antes de guardar.
 * Sin esto un id equivocado archiva pedidos o gastos bajo una sucursal
 * inexistente: los datos quedan huérfanos y desaparecen de los reportes.
 */
@Injectable()
export class BranchAccessService {
  constructor(
    @Inject('BranchRepositoryPort')
    private readonly branchRepository: BranchRepositoryPort,
  ) {}

  /** La sucursal existe y pertenece al tenant. Para lecturas y para cerrar caja. */
  async assertBelongsToTenant(branchId: string, tenantId: string): Promise<Branch> {
    const branch = await this.branchRepository.findById(branchId, tenantId);
    if (!branch) {
      throw new BadRequestException(`Sucursal ${branchId} no encontrada`);
    }
    return branch;
  }

  /**
   * Además, la sucursal está activa. Para todo lo que crea datos nuevos
   * (pedidos, gastos, apertura de caja, asignación de cajeros).
   */
  async assertUsable(branchId: string, tenantId: string): Promise<Branch> {
    const branch = await this.assertBelongsToTenant(branchId, tenantId);
    if (!branch.isActive) {
      throw new BadRequestException(`La sucursal ${branch.name} está desactivada`);
    }
    return branch;
  }
}
