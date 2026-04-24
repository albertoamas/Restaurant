import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RaffleDto } from '@pos/shared';
import { Raffle } from '../../domain/entities/raffle.entity';
import { RAFFLE_REPOSITORY_PORT, RaffleRepositoryPort } from '../../domain/ports/raffle-repository.port';
import { PRODUCT_REPOSITORY_PORT, ProductRepositoryPort } from '../../../catalog/domain/ports/product-repository.port';
import { CreateRaffleDto } from '../dto/create-raffle.dto';

@Injectable()
export class CreateRaffleUseCase {
  constructor(
    @Inject(RAFFLE_REPOSITORY_PORT)
    private readonly repo: RaffleRepositoryPort,
    @Inject(PRODUCT_REPOSITORY_PORT)
    private readonly productRepo: ProductRepositoryPort,
  ) {}

  async execute(tenantId: string, dto: CreateRaffleDto): Promise<RaffleDto> {
    const product = await this.productRepo.findById(dto.productId, tenantId);
    if (!product) throw new NotFoundException(`Producto ${dto.productId} no encontrado`);
    if (!product.isActive) throw new BadRequestException('El producto seleccionado no está activo');

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

    const raffle = Raffle.create(
      tenantId,
      dto.name,
      dto.productId,
      dto.numberOfWinners,
      dto.prizes.map((p) => ({ position: p.position, prizeDescription: p.prizeDescription })),
      dto.description,
    );

    await this.repo.createRaffle(raffle);

    const result = await this.repo.findRaffleWithTickets(raffle.id, tenantId);
    return result!;
  }
}
