import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAgentAuthGuard } from '../guards/jwt-agent-auth.guard';
import { JwtAdminAuthGuard } from '../guards/jwt-admin-auth.guard';
import { SuperAdminGuard } from '../guards/super-admin.guard';

export function AgentAuth() {
  return applyDecorators(UseGuards(JwtAdminAuthGuard, JwtAgentAuthGuard, SuperAdminGuard), ApiBearerAuth());
}
