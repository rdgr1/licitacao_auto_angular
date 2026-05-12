export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  ANALYST = 'ANALYST',
  VIEWER = 'VIEWER'
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: UserInfo;
  expiresIn: number;
}

export interface UserInfo {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  company?: string;
  avatar?: string;
}
