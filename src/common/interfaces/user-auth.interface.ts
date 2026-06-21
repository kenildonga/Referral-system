import type { Request } from 'express';

export interface UserJwtPayload {
  id: string;
  type: 'user';
  tokenVersion: number;
}

export interface AuthenticatedUser {
  id: string;
  phoneNumber: string;
}

export interface UserAuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
