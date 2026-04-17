import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@pos/shared';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../../../common/decorators/tenant.decorator';
import { CreateRaffleUseCase } from '../../application/use-cases/create-raffle.use-case';
import { ListRafflesUseCase } from '../../application/use-cases/list-raffles.use-case';
import { GetRaffleUseCase } from '../../application/use-cases/get-raffle.use-case';
import { CloseRaffleUseCase } from '../../application/use-cases/close-raffle.use-case';
import { ReopenRaffleUseCase } from '../../application/use-cases/reopen-raffle.use-case';
import { DeleteRaffleUseCase } from '../../application/use-cases/delete-raffle.use-case';
import { DrawWinnerUseCase } from '../../application/use-cases/draw-winner.use-case';
import { CreateRaffleDto } from '../../application/dto/create-raffle.dto';

@Controller('raffles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER)
export class RaffleController {
  constructor(
    private readonly createRaffle: CreateRaffleUseCase,
    private readonly listRaffles: ListRafflesUseCase,
    private readonly getRaffle: GetRaffleUseCase,
    private readonly closeRaffle: CloseRaffleUseCase,
    private readonly reopenRaffle: ReopenRaffleUseCase,
    private readonly deleteRaffle: DeleteRaffleUseCase,
    private readonly drawWinner: DrawWinnerUseCase,
  ) {}

  @Post()
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateRaffleDto) {
    return this.createRaffle.execute(tenantId, dto);
  }

  @Get()
  findAll(@CurrentTenant() tenantId: string) {
    return this.listRaffles.execute(tenantId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.getRaffle.execute(id, tenantId);
  }

  @Patch(':id/close')
  close(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.closeRaffle.execute(id, tenantId);
  }

  @Patch(':id/reopen')
  reopen(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.reopenRaffle.execute(id, tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.deleteRaffle.execute(id, tenantId);
  }

  @Post(':id/draw')
  draw(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.drawWinner.execute(id, tenantId);
  }
}
