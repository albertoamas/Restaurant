import { UserRole } from './enums';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  businessName: string;
  ownerName: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    tenantId: string;
    tenantName: string;
    tenantLogo: string | null;
    tenantAddress: string | null;
    tenantPhone: string | null;
    tenantSlogan: string | null;
    branchId: string | null;
  };
}

export interface JwtPayload {
  sub: string;
  tenantId: string;
  branchId: string | null;
  role: UserRole;
}
