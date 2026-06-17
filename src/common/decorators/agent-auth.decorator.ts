import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAdminOrAgentAuthGuard } from '../guards/jwt-admin-or-agent-auth.guard';

export function AgentAuth() {
  return applyDecorators(UseGuards(JwtAdminOrAgentAuthGuard), ApiBearerAuth());
}
