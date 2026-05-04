import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CatalogModule } from '../catalog/catalog.module';
import { CommonModule } from '../../common/common.module';
import { RAFFLE_REPOSITORY_PORT } from './domain/ports/raffle-repository.port';
import { RaffleRepository } from './infrastructure/persistence/raffle.repository';
import { RaffleController } from './infrastructure/controllers/raffle.controller';
import { CreateRaffleUseCase } from './application/use-cases/create-raffle.use-case';
import { ListRafflesUseCase } from './application/use-cases/list-raffles.use-case';
import { GetRaffleUseCase } from './application/use-cases/get-raffle.use-case';
import { CloseRaffleUseCase } from './application/use-cases/close-raffle.use-case';
import { ReopenRaffleUseCase } from './application/use-cases/reopen-raffle.use-case';
import { DeleteRaffleUseCase } from './application/use-cases/delete-raffle.use-case';
import { DrawWinnerUseCase } from './application/use-cases/draw-winner.use-case';
import { VoidWinnerUseCase } from './application/use-cases/void-winner.use-case';
import { DeliverTicketsUseCase } from './application/use-cases/deliver-tickets.use-case';
import { RaffleAutoTicketService } from './application/services/raffle-auto-ticket.service';

@Module({
  imports: [PrismaModule, CatalogModule, CommonModule],
  controllers: [RaffleController],
  providers: [
    { provide: RAFFLE_REPOSITORY_PORT, useClass: RaffleRepository },
    CreateRaffleUseCase,
    ListRafflesUseCase,
    GetRaffleUseCase,
    CloseRaffleUseCase,
    ReopenRaffleUseCase,
    DeleteRaffleUseCase,
    DrawWinnerUseCase,
    VoidWinnerUseCase,
    DeliverTicketsUseCase,
    RaffleAutoTicketService,
  ],
  exports: [RaffleAutoTicketService],
})
export class RafflesModule {}
