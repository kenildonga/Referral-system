import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import { Admin } from '../../entities/admins.entity';
import type {
  AuthenticatedRequest,
  JwtPayload,
} from '../interfaces/auth.interface';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
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
      const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

      const admin = await this.adminRepository.findOne({
        where: { id: decoded.id },
        select: {
          id: true,
          role: true,
          email: true,
          isActive: true,
          tokenVersion: true,
        },
      });

      if (!admin || !admin.isActive) {
        throw new UnauthorizedException('auth.invalidOrExpiredToken');
      }

      if (decoded.tokenVersion !== admin.tokenVersion) {
        throw new UnauthorizedException('auth.invalidOrExpiredToken');
      }

      request.admin = {
        id: admin.id,
        role: admin.role,
        email: admin.email,
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
