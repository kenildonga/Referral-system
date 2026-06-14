import type { Request } from 'express';
import { AdminRole } from '../constants/admin-role.enum';

export interface JwtPayload {
  id: string;
  role: AdminRole;
  tokenVersion: number;
}

export interface AuthenticatedAdmin {
  id: string;
  role: AdminRole;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  admin: AuthenticatedAdmin;
}
