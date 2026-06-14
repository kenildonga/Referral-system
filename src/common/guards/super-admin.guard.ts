import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AdminRole } from '../constants/admin-role.enum';
import type { AuthenticatedRequest } from '../interfaces/auth.interface';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (request.admin?.role !== AdminRole.SUPER_ADMIN) {
      throw new ForbiddenException('auth.notAuthorized');
    }

    return true;
  }
}
