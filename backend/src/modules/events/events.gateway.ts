import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { EventsService } from './events.service';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true },
  namespace: '/',
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly eventsService: EventsService,
  ) {}

  afterInit(server: Server) {
    this.eventsService.setServer(server);
  }

  handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.headers?.authorization as string)?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token) as {
        sub: string;
        tenantId: string;
        branchId: string | null;
        role: string;
      };

      client.data.userId = payload.sub;
      client.data.tenantId = payload.tenantId;
      client.data.branchId = payload.branchId;
      client.data.role = payload.role;

      // Join tenant-wide room (for OWNER)
      client.join(`tenant:${payload.tenantId}`);

      // Join branch-specific room
      if (payload.branchId) {
        client.join(`t:${payload.tenantId}:b:${payload.branchId}`);
      }
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(_client: Socket) {
    // nothing needed — Socket.IO auto-removes from rooms
  }
}
