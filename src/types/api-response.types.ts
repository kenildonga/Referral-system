import type { SafeAgent } from './safe-entity.types';

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
}

export interface ApiMessageResponse {
  message: string;
}

export type AuthTokenResponse<T extends Record<string, unknown>> = {
  accessToken: string;
} & T;

export interface PresignUploadResponse {
  uploadUrl: string;
  key: string;
  url: string;
  expiresIn: number;
}

export interface FileDownloadResponse {
  downloadUrl: string;
  expiresIn: number;
}

export interface AgentCredentials {
  agentLoginId: string;
  password: string;
}

export interface AgentCredentialsResponse {
  agent: SafeAgent;
  credentials: AgentCredentials;
}

export interface AgentResetPasswordResponse {
  message: string;
  credentials: AgentCredentials;
}

export interface UserLocationNames {
  stateName: string;
  cityName: string;
}