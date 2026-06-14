import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasswordResetOtp } from '../entities/password-reset-otp.entity';
import { Admin } from '../entities/admins.entity';
import { Agent } from '../entities/agents.entity';
import { OtpService } from './helpers/otp.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtAgentAuthGuard } from './guards/jwt-agent-auth.guard';
import { SuperAdminGuard } from './guards/super-admin.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([PasswordResetOtp, Admin, Agent]),
  ],
  providers: [OtpService, JwtAuthGuard, JwtAgentAuthGuard, SuperAdminGuard],
  exports: [OtpService, JwtAuthGuard, JwtAgentAuthGuard, SuperAdminGuard],
})
export class CommonModule {}
