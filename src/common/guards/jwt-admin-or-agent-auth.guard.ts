import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { isObservable, lastValueFrom } from 'rxjs';
import { JwtAdminAuthGuard } from './jwt-admin-auth.guard';
import { JwtAgentAuthGuard } from './jwt-agent-auth.guard';

@Injectable()
export class JwtAdminOrAgentAuthGuard implements CanActivate {
  constructor(
    private readonly jwtAdminAuthGuard: JwtAdminAuthGuard,
    private readonly jwtAgentAuthGuard: JwtAgentAuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (await this.tryGuard(this.jwtAdminAuthGuard, context)) {
      return true;
    }
    if (await this.tryGuard(this.jwtAgentAuthGuard, context)) {
      return true;
    }
    throw new UnauthorizedException('auth.invalidOrExpiredToken');
  }

  private async tryGuard(
    guard: CanActivate,
    context: ExecutionContext,
  ): Promise<boolean> {
    try {
      const result = guard.canActivate(context);
      if (isObservable(result)) {
        return await lastValueFrom(result);
      }
      return await result;
    } catch {
      return false;
    }
  }
}
