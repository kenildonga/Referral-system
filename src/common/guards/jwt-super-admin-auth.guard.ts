import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AdminRole } from '../../entities/enum';
import type { AuthenticatedRequest } from '../interfaces/auth.interface';
import { AdminGuard } from './jwt-admin-auth.guard';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private readonly AdminGuard: AdminGuard) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await this.AdminGuard.canActivate(context);

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (request.admin?.role !== AdminRole.SUPER_ADMIN) {
      throw new ForbiddenException('auth.notAuthorized');
    }

    return true;
  }
}
