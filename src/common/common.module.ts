import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasswordResetOtp } from '../entities/password-reset-otp.entity';
import { Admin } from '../entities/admins.entity';
import { Agent } from '../entities/agents.entity';
import { OtpService } from './helpers/otp.service';
import { S3Service } from './helpers/s3.service';
import { AdminGuard } from './guards/jwt-admin-auth.guard';
import { AgentGuard } from './guards/jwt-agent-auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([PasswordResetOtp, Admin, Agent])],
  providers: [OtpService, S3Service, AdminGuard, AgentGuard],
  exports: [OtpService, S3Service, AdminGuard, AgentGuard],
})
export class CommonModule {}
