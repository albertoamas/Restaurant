import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@pos/shared';
import { JwtPayload } from '../decorators/tenant.decorator';

export const NO_BRANCH_MESSAGE =
  'No tienes una sucursal asignada. Pídele al dueño del negocio que te asigne una desde Equipo.';

/**
 * Sucursal con la que opera una petición. El dueño elige (la que manda, o ninguna = todas).
 * Cualquier otro rol usa **solo** la suya, leída de la BD por `JwtStrategy`: nunca la que manda
 * el cliente. Un cajero sin sucursal no opera; antes `user.branchId ?? dto.branchId` le dejaba
 * usar cualquier sucursal del negocio.
 */
export function scopedBranchId(user: JwtPayload, requested?: string | null): string | undefined {
  if (user.role === UserRole.OWNER) return requested ?? undefined;
  if (!user.branchId) throw new ForbiddenException(NO_BRANCH_MESSAGE);
  return user.branchId;
}

/** Lanza si el usuario no puede tocar un registro de `recordBranchId`. `action`: "ver", "cobrar"... */
export function assertBranchAccess(user: JwtPayload, recordBranchId: string, action: string): void {
  if (scopedBranchId(user) === undefined) return; // dueño
  if (recordBranchId !== user.branchId) {
    throw new ForbiddenException(`No tienes permisos para ${action} pedidos de otra sucursal`);
  }
}
