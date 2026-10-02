import {
  OnGatewayConnection,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@pos/shared';
import { EventsService } from './events.service';
import { ActiveSessionService, TokenPayload } from '../auth/application/services/active-session.service';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true },
  namespace: '/',
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly eventsService: EventsService,
    private readonly activeSession: ActiveSessionService,
  ) {}

  /**
   * La sesión se valida en un middleware, antes de aceptar la conexión: un token de un usuario
   * desactivado o de un negocio suspendido recibe `connect_error` y nunca llega a conectar.
   * Mismo control que el HTTP: firma, negocio y usuario activos, sucursal leída de la BD.
   */
  afterInit(server: Server) {
    this.eventsService.setServer(server);
    server.use((client, next) => {
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.headers?.authorization as string)?.replace('Bearer ', '');
      if (!token) return next(new Error('Sin sesión'));
      let payload: TokenPayload;
      try {
        payload = this.jwtService.verify<TokenPayload>(token);
      } catch {
        return next(new Error('Sesión inválida'));
      }
      this.activeSession.resolve(payload)
        .then((session) => { client.data.session = session; next(); })
        .catch(() => next(new Error('Sesión inactiva')));
    });
  }

  /** Las salas dependen del rol (ver `EventsService`). */
  async handleConnection(client: Socket) {
    const session = client.data.session as TokenPayload | undefined;
    if (!session) {
      client.disconnect(true);
      return;
    }
    const rooms = [EventsService.tenantRoom(session.tenantId), EventsService.userRoom(session.sub)];
    if (session.role === UserRole.OWNER) rooms.push(EventsService.ownersRoom(session.tenantId));
    else if (session.branchId) rooms.push(EventsService.branchRoom(session.tenantId, session.branchId));
    await client.join(rooms);
  }
}
