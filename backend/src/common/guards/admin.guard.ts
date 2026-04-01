import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const secret = process.env.ADMIN_SECRET;
    if (!secret) throw new UnauthorizedException('Admin access not configured');

    const request = ctx.switchToHttp().getRequest<{ headers: Record<string, string> }>();
    const provided = request.headers['x-admin-key'];

    if (!provided || provided !== secret) {
      throw new UnauthorizedException('Invalid admin key');
    }
    return true;
  }
}
