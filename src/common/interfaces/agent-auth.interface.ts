import type { Request } from 'express';

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
