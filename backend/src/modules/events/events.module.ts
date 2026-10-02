import { Module } from '@nestjs/common';
import { EventsService } from './events.service';

/**
 * Solo el emisor. El gateway vive en `EventsGatewayModule` porque necesita `AuthModule`, y
 * `AuthModule` necesita este emisor (desconectar a un usuario desactivado): separarlos evita
 * la dependencia circular.
 */
@Module({
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
