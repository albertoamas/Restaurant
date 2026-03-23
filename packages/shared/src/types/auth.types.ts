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

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    tenantId: string;
    tenantName: string;
  };
}

export interface JwtPayload {
  sub: string;
  tenantId: string;
  role: UserRole;
}
