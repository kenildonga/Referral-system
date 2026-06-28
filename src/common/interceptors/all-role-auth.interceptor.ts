import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  mixin,
  NestInterceptor,
  Type,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { AdminGuard } from '../guards/jwt-admin-auth.guard';
import { AgentGuard } from '../guards/jwt-agent-auth.guard';
import { UserGuard } from '../guards/jwt-user-auth.guard';
import type {
  AuthenticatedRequest,
  AuthRole,
  AuthRolePreset,
} from '../../types/auth.types';

function resolveAllowedRoles(presets: AuthRolePreset[]): Set<AuthRole> {
  const allowed = new Set<AuthRole>();

  for (const preset of presets) {
    switch (preset) {
      case 'superAdmin':
        allowed.add('superAdmin');
        break;
      case 'admin':
        allowed.add('admin');
        allowed.add('superAdmin');
        break;
      case 'agent':
        allowed.add('agent');
        break;
      case 'user':
        allowed.add('user');
        break;
      case 'all':
        allowed.add('agent');
        allowed.add('user');
        allowed.add('admin');
        allowed.add('superAdmin');
        break;
    }
  }

  return allowed;
}

export function AllRoleAuthInterceptor(
  roles: AuthRolePreset[],
): Type<NestInterceptor> {
  const allowed = resolveAllowedRoles(roles);
  const needsAgentAuth = allowed.has('agent');
  const needsUserAuth = allowed.has('user');
  const needsAdminAuth = allowed.has('admin') || allowed.has('superAdmin');

  @Injectable()
  class MixinAllRoleAuthInterceptor implements NestInterceptor {
    constructor(
      private readonly adminGuard: AdminGuard,
      private readonly agentGuard: AgentGuard,
      private readonly userGuard: UserGuard,
    ) {}

    async intercept(
      context: ExecutionContext,
      next: CallHandler,
    ): Promise<Observable<unknown>> {
      const callerRole = await this.authenticate(context);
      if (!allowed.has(callerRole)) {
        throw new ForbiddenException('auth.notAuthorized');
      }
      return next.handle();
    }

    private async authenticate(context: ExecutionContext): Promise<AuthRole> {
      const authAttempts: Array<() => Promise<AuthRole>> = [];

      if (needsAdminAuth) {
        authAttempts.push(async () => {
          await this.adminGuard.canActivate(context);
          const request = context
            .switchToHttp()
            .getRequest<AuthenticatedRequest>();
          return request.admin.role;
        });
      }

      if (needsAgentAuth) {
        authAttempts.push(async () => {
          await this.agentGuard.canActivate(context);
          return 'agent';
        });
      }

      if (needsUserAuth) {
        authAttempts.push(async () => {
          await this.userGuard.canActivate(context);
          return 'user';
        });
      }

      let lastUnauthorizedError: UnauthorizedException | null = null;

      for (const attempt of authAttempts) {
        try {
          return await attempt();
        } catch (error) {
          if (error instanceof UnauthorizedException) {
            lastUnauthorizedError = error;
            continue;
          }
          throw error;
        }
      }

      if (lastUnauthorizedError) {
        throw lastUnauthorizedError;
      }

      throw new UnauthorizedException('auth.invalidOrExpiredToken');
    }
  }

  return mixin(MixinAllRoleAuthInterceptor);
}
