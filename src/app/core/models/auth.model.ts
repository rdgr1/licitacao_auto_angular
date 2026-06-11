export type UserRole = 'EMPLOYEE' | 'ADMIN' | 'USER' | 'PRESIDENT';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserInfo {
  uuid: string;
  name: string;
  email: string;
  role: UserRole;
  company?: string;
  funcao?: string;
  imageUrl?: string;
  enabledModules: string[];   // ['licitacoes'] as MVP default
  tourCompleted: boolean;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: UserInfo;
}

export interface RefreshResponse {
  token: string;
  expiresIn: number;
}

export interface MeProfile {
  username: string;
  email: string;
  funcao?: string;
  empresa?: string;
  imageUrl?: string;
}
