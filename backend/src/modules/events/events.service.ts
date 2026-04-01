import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class EventsService {
  private server: Server;

  setServer(server: Server) {
    this.server = server;
  }

  private room(tenantId: string, branchId: string): string {
    return `t:${tenantId}:b:${branchId}`;
  }

  emit(tenantId: string, branchId: string, event: string, data: unknown) {
    if (!this.server) return;
    this.server.to(this.room(tenantId, branchId)).emit(event, data);
  }

  // Broadcast to all branches of a tenant (for owner dashboards)
  emitToTenant(tenantId: string, event: string, data: unknown) {
    if (!this.server) return;
    this.server.to(`tenant:${tenantId}`).emit(event, data);
  }
}
