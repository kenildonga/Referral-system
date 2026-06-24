import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import { User } from '../../entities/users.entity';
import type {
  UserAuthenticatedRequest,
  UserJwtPayload,
} from '../interfaces/user-auth.interface';

@Injectable()
export class UserGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<UserAuthenticatedRequest>();
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
      const decoded = jwt.verify(token, jwtSecret) as UserJwtPayload;

      if (decoded.type !== 'user') {
        throw new UnauthorizedException('auth.invalidOrExpiredToken');
      }

      const user = await this.userRepository.findOne({
        where: { id: decoded.id },
        select: {
          id: true,
          phoneNumber: true,
          tokenVersion: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('auth.invalidOrExpiredToken');
      }

      if (decoded.tokenVersion !== user.tokenVersion) {
        throw new UnauthorizedException('auth.invalidOrExpiredToken');
      }

      request.user = {
        id: user.id,
        phoneNumber: user.phoneNumber,
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
