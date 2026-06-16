import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAdminAuthGuard } from '../guards/jwt-admin-auth.guard';

export function AdminAuth() {
  return applyDecorators(UseGuards(JwtAdminAuthGuard), ApiBearerAuth());
}
