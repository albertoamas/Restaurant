import { ConflictException, Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { TenantRepositoryPort } from '../../../tenant/domain/ports/tenant-repository.port';
import { Tenant } from '../../../tenant/domain/entities/tenant.entity';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { RegisterDto } from '../dto/register.dto';

const DEFAULT_BRANCH_NAME = 'Principal';
const MAX_SLUG_ATTEMPTS   = 50; // cota defensiva; en la práctica nunca se acerca
const MAX_CREATE_RETRIES  = 3;  // reintentos ante colisión de slug en carrera

/**
 * Normaliza un nombre de negocio a un slug de URL.
 *
 * Translitera acentos y eñes en vez de eliminarlos: "Café Ñandú" -> "cafe-nandu"
 * (no "caf-and"). Un nombre sin ningún caracter latino (solo emojis, símbolos)
 * cae al fallback "negocio" en vez de producir un slug vacío.
 */
export function slugify(text: string): string {
  const base = text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita las marcas diacríticas, deja la letra base
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')    // fuera emojis, puntuación, símbolos
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return base || 'negocio';
}

function isUniqueSlugViolation(err: unknown): boolean {
  return (
    err !== null &&
    typeof err === 'object' &&
    'code' in err &&
    (err as { code: string }).code === 'P2002'
  );
}

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject('UserRepositoryPort')
    private readonly userRepository: UserRepositoryPort,
    @Inject('TenantRepositoryPort')
    private readonly tenantRepository: TenantRepositoryPort,
  ) {}

  async execute(dto: RegisterDto, startActive = false) {
    const existingUser = await this.userRepository.findByEmailGlobal(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const branchName   = dto.branchName?.trim() || DEFAULT_BRANCH_NAME;

    for (let attempt = 1; attempt <= MAX_CREATE_RETRIES; attempt++) {
      const slug = await this.resolveUniqueSlug(dto.businessName);

      const baseTenant = Tenant.create(dto.businessName, slug);
      const tenant      = startActive ? baseTenant.withActive(true) : baseTenant;
      const owner       = { id: uuidv4(), email: dto.email, passwordHash, name: dto.ownerName };

      try {
        // Tenant + dueño + sucursal inicial en una sola transacción: si algo
        // falla a mitad de camino no queda un tenant huérfano sin dueño.
        await this.tenantRepository.createTenantWithOwner(tenant, owner, branchName);
        return { tenantId: tenant.id, message: 'Negocio creado correctamente.' };
      } catch (err) {
        // Dos altas con nombres que normalizan igual pueden pasar el chequeo
        // de resolveUniqueSlug casi al mismo tiempo, antes de que la primera
        // confirme su INSERT. Se reintenta con un slug recién resuelto en vez
        // de devolver un 500 sin mensaje útil.
        if (isUniqueSlugViolation(err) && attempt < MAX_CREATE_RETRIES) continue;
        throw err;
      }
    }

    // Inalcanzable: el bucle siempre retorna o relanza antes de agotar los intentos.
    throw new ConflictException('No se pudo crear el negocio. Intenta nuevamente.');
  }

  /** Devuelve un slug libre: el propio nombre normalizado, o con sufijo -2, -3... si ya existe. */
  private async resolveUniqueSlug(businessName: string): Promise<string> {
    const base = slugify(businessName);
    let candidate = base;
    let suffix = 2;

    while (await this.tenantRepository.findBySlug(candidate)) {
      if (suffix > MAX_SLUG_ATTEMPTS) {
        throw new ConflictException(`No se encontró un identificador libre para "${businessName}".`);
      }
      candidate = `${base}-${suffix}`;
      suffix++;
    }

    return candidate;
  }
}
