import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { SaasPlan } from '@pos/shared';
import { TenantRepositoryPort } from '../../../tenant/domain/ports/tenant-repository.port';
import { PlanRepositoryPort } from '../../../plans/domain/ports/plan-repository.port';
import { PlanModulesService } from '../../../plans/application/plan-modules.service';
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
    @Inject('PlanRepositoryPort')
    private readonly planRepository: PlanRepositoryPort,
    private readonly planModules: PlanModulesService,
  ) {}

  async execute(dto: RegisterDto, startActive = false) {
    const existingUser = await this.userRepository.findByEmailGlobal(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const branchName   = dto.branchName?.trim() || DEFAULT_BRANCH_NAME;

    // Los módulos salen del plan, no de constantes fijas: antes todo negocio
    // nuevo arrancaba igual sin importar cuánto pagaba.
    const plan = await this.planRepository.findById(SaasPlan.BASICO);
    if (!plan) throw new NotFoundException(`Plan ${SaasPlan.BASICO} no encontrado`);
    const modules = this.planModules.baseModules(plan);

    for (let attempt = 1; attempt <= MAX_CREATE_RETRIES; attempt++) {
      const slug = await this.resolveUniqueSlug(dto.businessName);

      const baseTenant = Tenant.create(dto.businessName, slug, modules, plan.id);
      const tenant      = startActive ? baseTenant.withActive(true) : baseTenant;
      const owner       = { id: uuidv4(), email: dto.email, passwordHash, name: dto.ownerName };

      try {
        // Tenant + dueño + sucursal inicial en una sola transacción: si algo
        // falla a mitad de camino no queda un tenant huérfano sin dueño.
        await this.tenantRepository.createTenantWithOwner(tenant, owner, branchName);
        return { tenantId: tenant.id, message: 'Negocio creado correctamente.' };
      } catch (err) {
        // Cualquier error que no sea colisión de slug se relanza tal cual.
        if (!isUniqueSlugViolation(err)) throw err;
        // Dos altas con nombres que normalizan igual pueden pasar el chequeo de
        // resolveUniqueSlug casi al mismo tiempo, antes de que la primera
        // confirme su INSERT. Se reintenta resolviendo un slug nuevo.
      }
    }

    // Agotados los reintentos, y siempre por colisión de slug: cualquier otro
    // error ya se relanzó dentro del bucle. Se traduce a un 409 en español en
    // vez de dejar escapar el P2002 crudo, que HttpExceptionFilter no atrapa
    // (solo cubre HttpException) y saldría como un 500 sin mensaje útil.
    throw new ConflictException(
      `No se pudo generar un identificador único para "${dto.businessName}". Intenta con otro nombre.`,
    );
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
