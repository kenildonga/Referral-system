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
import type { AuthenticatedRequest } from '../interfaces/auth.interface';

export type AuthRolePreset = 'superAdmin' | 'admin' | 'agent' | 'all';
type AuthRole = 'superAdmin' | 'admin' | 'agent';

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
      case 'all':
        allowed.add('agent');
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
  const needsAdminAuth =
    allowed.has('admin') || allowed.has('superAdmin');

  @Injectable()
  class MixinAllRoleAuthInterceptor implements NestInterceptor {
    constructor(
      private readonly adminGuard: AdminGuard,
      private readonly agentGuard: AgentGuard,
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

    private async authenticate(
      context: ExecutionContext,
    ): Promise<AuthRole> {
      if (needsAgentAuth && needsAdminAuth) {
        try {
          await this.adminGuard.canActivate(context);
          const request = context
            .switchToHttp()
            .getRequest<AuthenticatedRequest>();
          return request.admin.role as AuthRole;
        } catch (error) {
          if (!(error instanceof UnauthorizedException)) {
            throw error;
          }
        }

        await this.agentGuard.canActivate(context);
        return 'agent';
      }

      if (needsAgentAuth) {
        await this.agentGuard.canActivate(context);
        return 'agent';
      }

      await this.adminGuard.canActivate(context);
      const request = context
        .switchToHttp()
        .getRequest<AuthenticatedRequest>();
      return request.admin.role as AuthRole;
    }
  }

  return mixin(MixinAllRoleAuthInterceptor);
}
