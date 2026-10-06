import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

/**
 * Salas (las arma `EventsGateway` al conectar):
 * - `tenant:{tenantId}`          todo el negocio (dueños y cajeros)
 * - `t:{tenantId}:owners`        solo dueños
 * - `t:{tenantId}:b:{branchId}`  cajeros de esa sucursal
 * - `user:{userId}`              los sockets de una persona
 *
 * Elegí el método por quién puede ver el dato, no por comodidad: un cajero no debe recibir
 * pedidos de otra sucursal ni datos de módulos del dueño (gastos, sorteos).
 */
@Injectable()
export class EventsService {
  private server: Server;

  setServer(server: Server) {
    this.server = server;
  }

  static tenantRoom(tenantId: string) { return `tenant:${tenantId}`; }
  static ownersRoom(tenantId: string) { return `t:${tenantId}:owners`; }
  static branchRoom(tenantId: string, branchId: string) { return `t:${tenantId}:b:${branchId}`; }
  static userRoom(userId: string) { return `user:${userId}`; }

  /** Datos de todo el negocio que también usa el cajero: catálogo, clientes, módulos. */
  emitToTenant(tenantId: string, event: string, data: unknown) {
    this.server?.to(EventsService.tenantRoom(tenantId)).emit(event, data);
  }

  /** Datos de una sucursal (pedidos, caja): los dueños y los cajeros de esa sucursal. */
  emitToBranch(tenantId: string, branchId: string, event: string, data: unknown) {
    this.server
      ?.to([EventsService.ownersRoom(tenantId), EventsService.branchRoom(tenantId, branchId)])
      .emit(event, data);
  }

  /** Datos que solo ve el dueño (gastos, sorteos). */
  emitToOwners(tenantId: string, event: string, data: unknown) {
    this.server?.to(EventsService.ownersRoom(tenantId)).emit(event, data);
  }

  /** Solo a los sockets de una persona. */
  emitToUser(userId: string, event: string, data: unknown) {
    this.server?.to(EventsService.userRoom(userId)).emit(event, data);
  }

  /** Cambia de sala de sucursal los sockets abiertos de un usuario reasignado. */
  async moveUserToBranch(tenantId: string, userId: string, branchId: string | null) {
    if (!this.server) return;
    const prefix = `t:${tenantId}:b:`;
    const sockets = await this.server.in(EventsService.userRoom(userId)).fetchSockets();
    for (const socket of sockets) {
      for (const room of socket.rooms) if (room.startsWith(prefix)) socket.leave(room);
      if (branchId) socket.join(EventsService.branchRoom(tenantId, branchId));
    }
  }

  /** Corta los sockets de un usuario desactivado. El cliente no reintenta tras un corte del servidor. */
  disconnectUser(userId: string) {
    this.server?.in(EventsService.userRoom(userId)).disconnectSockets(true);
  }

  /** Corta los sockets de todo un negocio suspendido. */
  disconnectTenant(tenantId: string) {
    this.server?.in(EventsService.tenantRoom(tenantId)).disconnectSockets(true);
  }
}
