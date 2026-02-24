export type UserRole = 'admin' | 'socio' | 'associado' | 'estagiario';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  workspace_id: string;
  workspace_name: string;
  is_active: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  workspace_name: string;
  document: string;
  admin_name: string;
  admin_email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface InviteRequest {
  email: string;
  name: string;
  role: UserRole;
}
