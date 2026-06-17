import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AdminRole } from '../../entities/enum';
import type { AuthenticatedRequest } from '../interfaces/auth.interface';

@Injectable()
export class AdminRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const role = request.admin?.role;

    if (role !== AdminRole.SUPER_ADMIN && role !== AdminRole.ADMIN) {
      throw new ForbiddenException('auth.notAuthorized');
    }

    return true;
  }
}
