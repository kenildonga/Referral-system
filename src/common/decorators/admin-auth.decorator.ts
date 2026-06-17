import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAdminAuthGuard } from '../guards/jwt-admin-auth.guard';
import { AdminRoleGuard } from '../guards/admin-role.guard';

export function AdminAuth() {
  return applyDecorators(
    UseGuards(JwtAdminAuthGuard, AdminRoleGuard),
    ApiBearerAuth(),
  );
}
