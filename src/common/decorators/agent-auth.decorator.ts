import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAgentAuthGuard } from '../guards/jwt-agent-auth.guard';

export function AgentAuth() {
  return applyDecorators(UseGuards(JwtAgentAuthGuard), ApiBearerAuth());
}
