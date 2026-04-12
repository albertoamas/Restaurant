import { timingSafeEqual } from 'crypto';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const secret = process.env.ADMIN_SECRET;
    if (!secret) throw new UnauthorizedException('Admin access not configured');

    const request = ctx.switchToHttp().getRequest<{ headers: Record<string, string> }>();
    const provided = request.headers['x-admin-key'];

    if (!provided) {
      throw new UnauthorizedException('Invalid admin key');
    }

    // Comparación en tiempo constante para prevenir timing attacks.
    // Si las longitudes difieren, la comparación es falsa de forma inmediata — igualmente seguro.
    const a = Buffer.from(provided);
    const b = Buffer.from(secret);
    const valid = a.length === b.length && timingSafeEqual(a, b);

    if (!valid) {
      throw new UnauthorizedException('Invalid admin key');
    }
    return true;
  }
}
