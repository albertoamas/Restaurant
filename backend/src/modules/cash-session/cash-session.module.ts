import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { CommonModule } from '../../common/common.module';
import { CashSessionRepository } from './infrastructure/persistence/cash-session.repository';
import { CashSessionController } from './infrastructure/controllers/cash-session.controller';
import { OpenCashSessionUseCase } from './application/use-cases/open-cash-session.use-case';
import { CloseCashSessionUseCase } from './application/use-cases/close-cash-session.use-case';
import { GetCurrentSessionUseCase } from './application/use-cases/get-current-session.use-case';
import { GetSessionHistoryUseCase } from './application/use-cases/get-session-history.use-case';

@Module({
  imports: [EventsModule, CommonModule],
  controllers: [CashSessionController],
  providers: [
    { provide: 'CashSessionRepositoryPort', useClass: CashSessionRepository },
    OpenCashSessionUseCase,
    CloseCashSessionUseCase,
    GetCurrentSessionUseCase,
    GetSessionHistoryUseCase,
  ],
  exports: ['CashSessionRepositoryPort'],
})
export class CashSessionModule {}
