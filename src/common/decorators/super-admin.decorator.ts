import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAdminAuthGuard } from '../guards/jwt-admin-auth.guard';
import { SuperAdminGuard } from '../guards/super-admin.guard';

export function SuperAdmin() {
  return applyDecorators(
    UseGuards(JwtAdminAuthGuard, SuperAdminGuard),
    ApiBearerAuth(),
  );
}
