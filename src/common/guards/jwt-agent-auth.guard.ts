import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import { Agent } from '../../entities/agents.entity';
import type {
  AgentAuthenticatedRequest,
  AgentJwtPayload,
} from '../interfaces/agent-auth.interface';

@Injectable()
export class JwtAgentAuthGuard implements CanActivate {
  constructor(
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<AgentAuthenticatedRequest>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('auth.missingAuthHeader');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('auth.invalidAuthFormat');
    }

    try {
      const jwtSecret = process.env.JWT_SECRET || 'dev-secret-key-change-me';
      const decoded = jwt.verify(token, jwtSecret) as AgentJwtPayload;

      if (decoded.type !== 'agent') {
        throw new UnauthorizedException('auth.invalidOrExpiredToken');
      }

      const agent = await this.agentRepository.findOne({
        where: { id: decoded.id },
        select: {
          id: true,
          agentLoginId: true,
          isActive: true,
          tokenVersion: true,
        },
      });

      if (!agent || !agent.isActive) {
        throw new UnauthorizedException('auth.invalidOrExpiredToken');
      }

      if (decoded.tokenVersion !== agent.tokenVersion) {
        throw new UnauthorizedException('auth.invalidOrExpiredToken');
      }

      request.agent = {
        id: agent.id,
        agentLoginId: agent.agentLoginId,
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('auth.invalidOrExpiredToken');
    }
  }
}
