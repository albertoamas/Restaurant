import { createParamDecorator, ExecutionContext, InternalServerErrorException } from '@nestjs/common';
import { UserRole } from '@pos/shared';

export interface JwtPayload {
  sub: string;
  tenantId: string;
  branchId: string | null;
  role: UserRole;
}

export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const tenantId = request.user?.tenantId;
    if (!tenantId) throw new InternalServerErrorException('@CurrentTenant used without JwtAuthGuard');
    return tenantId;
  },
);

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
