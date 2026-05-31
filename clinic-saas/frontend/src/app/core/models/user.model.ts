export type Role = 'PLATFORM_ADMIN' | 'ADMIN' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST';

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  role: Role;
  tenantId: string | null;
}

export interface CurrentUser {
  id: string;
  email: string;
  role: Role;
  tenantId: string | null;
  userType: 'TENANT' | 'PLATFORM';
}
