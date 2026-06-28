import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PhoneRegistrationOtp } from '../entities/phone-registration-otp.entity';
import { Admin } from '../entities/admins.entity';
import { Agent } from '../entities/agents.entity';
import { User } from '../entities/users.entity';
import { OtpService } from './helpers/otp.service';
import { DatabaseBootstrapService } from './helpers/database-bootstrap.service';
import { S3Service } from './helpers/s3.service';
import { AdminGuard } from './guards/jwt-admin-auth.guard';
import { AgentGuard } from './guards/jwt-agent-auth.guard';
import { UserGuard } from './guards/jwt-user-auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([PhoneRegistrationOtp, Admin, Agent, User])],
  providers: [
    OtpService,
    DatabaseBootstrapService,
    S3Service,
    AdminGuard,
    AgentGuard,
    UserGuard,
  ],
  exports: [OtpService, S3Service, AdminGuard, AgentGuard, UserGuard],
})
export class CommonModule {}
