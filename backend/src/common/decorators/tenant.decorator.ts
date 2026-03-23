import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '@pos/shared';

export interface JwtPayload {
  sub: string;
  tenantId: string;
  role: UserRole;
}

export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.tenantId;
  },
);

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
