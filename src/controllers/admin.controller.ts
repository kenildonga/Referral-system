import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AdminService } from '../services/admin.service';
import {
  CreateAdminDto,
  LoginAdminDto,
  UpdateAdminDto,
  ResetAdminPasswordDto,
  UpdateAdminStatusDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordOtpDto,
} from '../dto/admin.dto';
import { AdminGuard } from '../common/guards/jwt-admin-auth.guard';
import { SuperAdminGuard } from '../common/guards/jwt-super-admin-auth.guard';
import type { AuthenticatedRequest } from '../common/interfaces/auth.interface';

@ApiTags('admins')
@Controller('admins')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Admin login (Admin and Super Admin)' })
  login(@Body() loginAdminDto: LoginAdminDto) {
    return this.adminService.login(loginAdminDto);
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Request password reset OTP (Admin and Super Admin)' })
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.adminService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Reset password with OTP (Admin and Super Admin)' })
  resetPassword(@Body() resetPasswordOtpDto: ResetPasswordOtpDto) {
    return this.adminService.resetPasswordWithOtp(resetPasswordOtpDto);
  }

  @Post('logout')
  @UseGuards(AdminGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin logout (Admin and Super Admin)' })
  logout(@Req() req: AuthenticatedRequest) {
    return this.adminService.logout(req.admin.id);
  }

  @Patch('me/password')
  @UseGuards(AdminGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change own password (Admin)' })
  changePassword(
    @Req() req: AuthenticatedRequest,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.adminService.changePassword(req.admin.id, changePasswordDto);
  }

  @Post()
  @UseGuards(SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new admin (Super Admin)' })
  create(@Body() createAdminDto: CreateAdminDto) {
    return this.adminService.create(createAdminDto);
  }

  @Get()
  @UseGuards(SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all admins (Super Admin)' })
  findAll(@Req() req: AuthenticatedRequest) {
    return this.adminService.findAll(req.admin.id);
  }

  @Get(':id')
  @UseGuards(SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get an admin by ID (Super Admin)' })
  findOne(@Param('id') id: string) {
    return this.adminService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update admin details (Super Admin)' })
  update(@Param('id') id: string, @Body() updateAdminDto: UpdateAdminDto) {
    return this.adminService.update(id, updateAdminDto);
  }

  @Patch(':id/reset-password')
  @UseGuards(SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reset admin password (Super Admin)' })
  resetAdminPassword(
    @Param('id') id: string,
    @Body() resetAdminPasswordDto: ResetAdminPasswordDto,
  ) {
    return this.adminService.resetPassword(id, resetAdminPasswordDto);
  }

  @Patch(':id/status')
  @UseGuards(SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update admin active status (Super Admin)' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateAdminStatusDto: UpdateAdminStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.adminService.updateStatus(id, updateAdminStatusDto, req.admin);
  }
}
