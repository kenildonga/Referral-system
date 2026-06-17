import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasswordResetOtp } from '../entities/password-reset-otp.entity';
import { Admin } from '../entities/admins.entity';
import { Agent } from '../entities/agents.entity';
import { OtpService } from './helpers/otp.service';
import { S3Service } from './helpers/s3.service';
import { JwtAdminAuthGuard } from './guards/jwt-admin-auth.guard';
import { JwtAgentAuthGuard } from './guards/jwt-agent-auth.guard';
import { JwtAdminOrAgentAuthGuard } from './guards/jwt-admin-or-agent-auth.guard';
import { AdminRoleGuard } from './guards/admin-role.guard';
import { SuperAdminGuard } from './guards/super-admin.guard';

@Module({
  imports: [TypeOrmModule.forFeature([PasswordResetOtp, Admin, Agent])],
  providers: [
    OtpService,
    S3Service,
    JwtAdminAuthGuard,
    JwtAgentAuthGuard,
    JwtAdminOrAgentAuthGuard,
    AdminRoleGuard,
    SuperAdminGuard,
  ],
  exports: [
    OtpService,
    S3Service,
    JwtAdminAuthGuard,
    JwtAgentAuthGuard,
    JwtAdminOrAgentAuthGuard,
    AdminRoleGuard,
    SuperAdminGuard,
  ],
})
export class CommonModule {}
