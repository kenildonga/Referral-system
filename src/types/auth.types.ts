import type { Request } from 'express';
import { AdminRole } from '../entities/enum';

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

export interface AgentJwtPayload {
  id: string;
  type: 'agent';
  tokenVersion: number;
}

export interface AuthenticatedAgent {
  id: string;
  agentLoginId: string;
}

export interface AgentAuthenticatedRequest extends Request {
  agent: AuthenticatedAgent;
}

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

export type FormAccessRequest =
  | AuthenticatedRequest
  | AgentAuthenticatedRequest
  | UserAuthenticatedRequest;

export type SubmitterRequest =
  | AgentAuthenticatedRequest
  | UserAuthenticatedRequest;

export type AuthRolePreset = 'superAdmin' | 'admin' | 'agent' | 'user' | 'all';

export type AuthRole = 'superAdmin' | 'admin' | 'agent' | 'user';