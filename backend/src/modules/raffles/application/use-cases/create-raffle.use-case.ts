import { BadRequestException, Inject, Injectable, Optional } from '@nestjs/common';
import { RaffleDetailDto, SOCKET_EVENTS } from '@pos/shared';
import { Raffle } from '../../domain/entities/raffle.entity';
import { RAFFLE_REPOSITORY_PORT, RaffleRepositoryPort } from '../../domain/ports/raffle-repository.port';
import { CATEGORY_REPOSITORY_PORT, CategoryRepositoryPort } from '../../../catalog/domain/ports/category-repository.port';
import { CreateRaffleDto } from '../dto/create-raffle.dto';
import { EventsService } from '../../../events/events.service';

@Injectable()
export class CreateRaffleUseCase {
  constructor(
    @Inject(RAFFLE_REPOSITORY_PORT)
    private readonly repo: RaffleRepositoryPort,
    @Inject(CATEGORY_REPOSITORY_PORT)
    private readonly categoryRepo: CategoryRepositoryPort,
    @Optional() private readonly eventsService?: EventsService,
  ) {}

  async execute(tenantId: string, dto: CreateRaffleDto): Promise<RaffleDetailDto> {
    const { ticketMode } = dto;

    // Validación de campos condicionales por modo
    if (ticketMode === 'CATEGORY_MATCH') {
      await this.assertCategoriesUsable(dto.categoryIds ?? [], tenantId);
    }

    if (ticketMode === 'SPENDING_THRESHOLD') {
      if (!dto.spendingThreshold || dto.spendingThreshold < 1) {
        throw new BadRequestException('spendingThreshold debe ser un entero mayor a 0 para el modo SPENDING_THRESHOLD');
      }
    }

    if (dto.prizes.length !== dto.numberOfWinners) {
      throw new BadRequestException(
        `Se deben definir exactamente ${dto.numberOfWinners} premios (uno por posición)`,
      );
    }

    const positions = dto.prizes.map((p) => p.position).sort((a, b) => a - b);
    for (let i = 0; i < positions.length; i++) {
      if (positions[i] !== i + 1) {
        throw new BadRequestException('Las posiciones de los premios deben ser consecutivas comenzando en 1');
      }
    }

    const raffle = Raffle.create({
      tenantId,
      name: dto.name,
      description: dto.description,
      ticketMode,
      productId: null,
      categoryIds: dto.categoryIds,
      spendingThreshold: dto.spendingThreshold ?? null,
      numberOfWinners: dto.numberOfWinners,
      prizes: dto.prizes.map((p) => ({ position: p.position, prizeDescription: p.prizeDescription })),
    });

    await this.repo.createRaffle(raffle);

    const result = await this.repo.findRaffleWithTickets(raffle.id, tenantId);
    this.eventsService?.emitToOwners(tenantId, SOCKET_EVENTS.RAFFLE_CREATED, result);
    return result!;
  }

  /** Todas las categorías existen, son del negocio y están activas. */
  private async assertCategoriesUsable(categoryIds: string[], tenantId: string): Promise<void> {
    const categories = await this.categoryRepo.findByIds(categoryIds, tenantId);
    if (categories.length !== categoryIds.length) {
      throw new BadRequestException('Alguna de las categorías elegidas no existe');
    }
    const inactive = categories.find((c) => !c.isActive);
    if (inactive) {
      throw new BadRequestException(`La categoría "${inactive.name}" no está activa`);
    }
  }
}
