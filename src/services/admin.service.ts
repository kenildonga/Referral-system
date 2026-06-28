import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, FindOptionsSelect } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { Admin } from '../entities/admins.entity';
import { Agent } from '../entities/agents.entity';
import { User } from '../entities/users.entity';
import {
  CreateAdminDto,
  UpdateAdminDto,
  ResetAdminPasswordDto,
  UpdateAdminStatusDto,
  LoginAdminDto,
  ChangePasswordDto,
  ResetPasswordOtpDto,
} from '../dto/admin.dto';
import { AdminRole, OtpPurpose } from '../entities/enum';
import type { AuthenticatedAdmin } from '../types/auth.types';
import type { SafeAdmin } from '../types/safe-entity.types';
import type {
  AuthTokenResponse,
  ApiMessageResponse,
} from '../types/api-response.types';
import { OtpService } from '../common/helpers/otp.service';
import { I18nService } from '../i18n/i18n.service';

const SAFE_ADMIN_SELECT: FindOptionsSelect<Admin> = {
  id: true,
  name: true,
  email: true,
  phoneNumber: true,
  role: true,
  isActive: true,
  lastLogin: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly otpService: OtpService,
    private readonly i18n: I18nService,
  ) {}

  // --- Auth ---

  async login(
    loginAdminDto: LoginAdminDto,
  ): Promise<AuthTokenResponse<{ admin: SafeAdmin }>> {
    const admin = await this.adminRepository.findOne({
      where: { email: loginAdminDto.email },
    });

    if (!admin || !admin.isActive) {
      throw new ForbiddenException('auth.invalidEmailOrPassword');
    }

    const isPasswordValid = await bcrypt.compare(
      loginAdminDto.password,
      admin.password,
    );
    if (!isPasswordValid) {
      throw new ForbiddenException('auth.invalidEmailOrPassword');
    }

    const accessToken = this.signToken(admin);
    admin.lastLogin = new Date();
    await this.adminRepository.save(admin);

    return { accessToken, admin: this.toSafeAdmin(admin) };
  }

  async logout(adminId: string): Promise<ApiMessageResponse> {
    await this.incrementTokenVersion(adminId);
    return { message: this.i18n.t('auth.logoutSuccess') };
  }

  async changePassword(
    adminId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<ApiMessageResponse> {
    const admin = await this.adminRepository.findOne({
      where: { id: adminId },
    });
    if (!admin) {
      throw new ForbiddenException('auth.invalidOrExpiredToken');
    }

    const isCurrentValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      admin.password,
    );
    if (!isCurrentValid) {
      throw new ForbiddenException('auth.currentPasswordIncorrect');
    }

    await this.updatePassword(admin, changePasswordDto.newPassword);
    return { message: this.i18n.t('auth.passwordChangedSuccess') };
  }

  async forgotPassword(phoneNumber: string): Promise<ApiMessageResponse> {
    const admin = await this.adminRepository.findOne({
      where: { phoneNumber, isActive: true },
    });
    if (admin) {
      await this.otpService.issuePhoneOtp(phoneNumber, OtpPurpose.PASSWORD_RESET);
    }

    return { message: this.i18n.t('auth.forgotPasswordGeneric') };
  }

  async resetPasswordWithOtp(
    resetPasswordOtpDto: ResetPasswordOtpDto,
  ): Promise<ApiMessageResponse> {
    const { phoneNumber, otp, newPassword } = resetPasswordOtpDto;

    const admin = await this.adminRepository.findOne({
      where: { phoneNumber, isActive: true },
    });
    if (!admin) {
      throw new BadRequestException('otp.invalidOrExpired');
    }

    await this.otpService.verifyPhoneOtp(
      phoneNumber,
      otp,
      OtpPurpose.PASSWORD_RESET,
    );
    await this.updatePassword(admin, newPassword);

    return { message: this.i18n.t('auth.passwordResetSuccess') };
  }

  // --- SuperAdmin management ---

  async create(createAdminDto: CreateAdminDto): Promise<SafeAdmin> {
    const existing = await this.adminRepository.findOne({
      where: { email: createAdminDto.email },
    });
    if (existing) {
      throw new ConflictException('admin.emailExists');
    }

    await this.assertPhoneAvailable(createAdminDto.phoneNumber);

    const admin = this.adminRepository.create({
      name: createAdminDto.name,
      email: createAdminDto.email,
      phoneNumber: createAdminDto.phoneNumber,
      password: await this.hashPassword(createAdminDto.password),
      role: createAdminDto.role,
      isActive: true,
      tokenVersion: 0,
    });

    const saved = await this.adminRepository.save(admin);
    return this.toSafeAdmin(saved);
  }

  async findAll(requesterId: string): Promise<SafeAdmin[]> {
    return this.adminRepository.find({
      where: { id: Not(requesterId) },
      select: SAFE_ADMIN_SELECT,
    });
  }

  async findOne(id: string): Promise<SafeAdmin> {
    const admin = await this.adminRepository.findOne({
      where: { id },
      select: SAFE_ADMIN_SELECT,
    });
    if (!admin) {
      throw new NotFoundException(this.i18n.t('admin.notFound', { id }));
    }
    return admin;
  }

  async update(id: string, updateAdminDto: UpdateAdminDto): Promise<SafeAdmin> {
    const admin = await this.findByIdOrFail(id);

    if (
      updateAdminDto.role !== undefined &&
      updateAdminDto.role !== AdminRole.SUPER_ADMIN &&
      admin.role === AdminRole.SUPER_ADMIN
    ) {
      await this.ensureNotLastSuperAdmin(admin.id, 'demote');
    }

    if (updateAdminDto.email && updateAdminDto.email !== admin.email) {
      const existing = await this.adminRepository.findOne({
        where: { email: updateAdminDto.email },
      });
      if (existing) {
        throw new ConflictException('admin.emailExists');
      }
      admin.email = updateAdminDto.email;
    }

    if (
      updateAdminDto.phoneNumber &&
      updateAdminDto.phoneNumber !== admin.phoneNumber
    ) {
      await this.assertPhoneAvailable(updateAdminDto.phoneNumber, admin.id);
      admin.phoneNumber = updateAdminDto.phoneNumber;
    }

    if (updateAdminDto.name !== undefined) {
      admin.name = updateAdminDto.name;
    }

    if (updateAdminDto.role !== undefined) {
      admin.role = updateAdminDto.role;
    }

    const saved = await this.adminRepository.save(admin);
    return this.toSafeAdmin(saved);
  }

  async resetPassword(
    id: string,
    resetAdminPasswordDto: ResetAdminPasswordDto,
  ): Promise<ApiMessageResponse> {
    const admin = await this.findByIdOrFail(id);
    await this.updatePassword(admin, resetAdminPasswordDto.newPassword);
    return { message: this.i18n.t('auth.passwordResetSuccess') };
  }

  async updateStatus(
    id: string,
    updateAdminStatusDto: UpdateAdminStatusDto,
    requester: AuthenticatedAdmin,
  ): Promise<SafeAdmin> {
    const admin = await this.findByIdOrFail(id);

    if (!updateAdminStatusDto.isActive) {
      if (admin.id === requester.id) {
        throw new ForbiddenException('admin.cannotDeactivateSelf');
      }
      if (admin.role === AdminRole.SUPER_ADMIN) {
        await this.ensureNotLastSuperAdmin(admin.id, 'deactivate');
      }
    }

    admin.isActive = updateAdminStatusDto.isActive;
    const saved = await this.adminRepository.save(admin);
    return this.toSafeAdmin(saved);
  }

  // --- Private helpers ---

  private async assertPhoneAvailable(
    phoneNumber: string,
    excludeAdminId?: string,
  ): Promise<void> {
    const existingAdmin = await this.adminRepository.findOne({
      where: { phoneNumber },
      select: { id: true },
    });
    if (existingAdmin && existingAdmin.id !== excludeAdminId) {
      throw new ConflictException('admin.phoneNumberExists');
    }

    const existingAgent = await this.agentRepository.findOne({
      where: { phoneNumber },
      select: { id: true },
    });
    if (existingAgent) {
      throw new ConflictException('agent.phoneNumberExists');
    }

    const existingUser = await this.userRepository.findOne({
      where: { phoneNumber },
      select: { id: true },
    });
    if (existingUser) {
      throw new ConflictException('user.phoneNumberAlreadyExists');
    }
  }

  private async findByIdOrFail(id: string): Promise<Admin> {
    const admin = await this.adminRepository.findOne({ where: { id } });
    if (!admin) {
      throw new NotFoundException(this.i18n.t('admin.notFound', { id }));
    }
    return admin;
  }

  private async updatePassword(
    admin: Admin,
    plainPassword: string,
  ): Promise<void> {
    admin.password = await this.hashPassword(plainPassword);
    admin.tokenVersion += 1;
    await this.adminRepository.save(admin);
  }

  private async ensureNotLastSuperAdmin(
    adminId: string,
    action: 'demote' | 'deactivate',
  ): Promise<void> {
    const activeSuperAdminCount = await this.adminRepository.count({
      where: { role: AdminRole.SUPER_ADMIN, isActive: true },
    });

    if (activeSuperAdminCount <= 1) {
      const target = await this.adminRepository.findOne({
        where: { id: adminId, role: AdminRole.SUPER_ADMIN, isActive: true },
      });
      if (target) {
        throw new ForbiddenException(
          this.i18n.t('admin.cannotModifyLastSuperAdmin', {
            action: this.i18n.t(`admin.action.${action}`),
          }),
        );
      }
    }
  }

  private signToken(admin: Admin): string {
    const jwtSecret = process.env.JWT_SECRET || 'dev-secret-key-change-me';
    const expiresIn = process.env.JWT_EXPIRES_IN || '1d';

    return jwt.sign(
      { id: admin.id, role: admin.role, tokenVersion: admin.tokenVersion },
      jwtSecret,
      { expiresIn } as jwt.SignOptions,
    );
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  private async incrementTokenVersion(adminId: string): Promise<void> {
    const admin = await this.adminRepository.findOne({
      where: { id: adminId },
    });
    if (!admin) {
      throw new ForbiddenException('auth.invalidOrExpiredToken');
    }
    admin.tokenVersion += 1;
    await this.adminRepository.save(admin);
  }

  private toSafeAdmin(admin: Admin): SafeAdmin {
    const { password, tokenVersion, ...safeAdmin } = admin;
    return safeAdmin;
  }
}
