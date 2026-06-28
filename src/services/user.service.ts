import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { User } from '../entities/users.entity';
import { Agent } from '../entities/agents.entity';
import { State } from '../entities/states.entity';
import { City } from '../entities/cities.entity';
import {
  FillUserFormDto,
  SendRegistrationOtpDto,
  UpdateUserAgentDto,
  ListAgentsQueryDto,
  LoginUserDto,
} from '../dto/user.dto';
import { I18nService } from '../i18n/i18n.service';
import { UserStatus, BankHolderType } from '../entities/enum';
import { normalizeMiddleName } from '../common/utils/name.util';
import { OtpService } from '../common/helpers/otp.service';
import { BankDetailsService } from './bank-details.service';
import type { SafeAgent, SafeUser } from '../types/safe-entity.types';
import type {
  AuthTokenResponse,
  ApiMessageResponse,
  UserLocationNames,
} from '../types/api-response.types';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    @InjectRepository(State)
    private readonly stateRepository: Repository<State>,
    @InjectRepository(City)
    private readonly cityRepository: Repository<City>,
    private readonly i18n: I18nService,
    private readonly otpService: OtpService,
    private readonly bankDetailsService: BankDetailsService,
  ) {}

  async sendRegistrationOtp(dto: SendRegistrationOtpDto): Promise<ApiMessageResponse> {
    await this.assertPhoneAvailableForRegistration(dto.phoneNumber);
    await this.otpService.issuePhoneOtp(dto.phoneNumber);
    return { message: 'OTP sent successfully' };
  }

  private async assertPhoneAvailableForRegistration(phoneNumber: string): Promise<void> {
    const existingUser = await this.userRepository.findOne({
      where: { phoneNumber },
      select: { id: true },
    });
    if (existingUser) {
      throw new BadRequestException('user.phoneNumberAlreadyExists');
    }

    const existingAgent = await this.agentRepository.findOne({
      where: { phoneNumber },
      select: { id: true },
    });
    if (existingAgent) {
      throw new BadRequestException('agent.phoneNumberExists');
    }
  }

  async fillForm(dto: FillUserFormDto): Promise<SafeUser> {
    await this.assertPhoneAvailableForRegistration(dto.phoneNumber);

    await this.otpService.verifyPhoneOtp(dto.phoneNumber, dto.otp);

    let referredByUserId: string | null = null;
    const incomingReferralCode = dto.referralCode?.trim().toUpperCase();

    if (incomingReferralCode) {
      const referrer = await this.userRepository.findOne({
        where: {
          referralCode: incomingReferralCode,
          status: UserStatus.APPROVED,
        },
        select: { id: true },
      });

      if (!referrer) {
        throw new BadRequestException('user.invalidReferralCode');
      }

      referredByUserId = referrer.id;
    }

    const user = this.userRepository.create({
      firstName: dto.firstName,
      middleName: normalizeMiddleName(dto.middleName),
      lastName: dto.lastName,
      phoneNumber: dto.phoneNumber,
      email: dto.email,
      password: await this.hashPassword(dto.password),
      agentId: null,
      referredByUserId,
      dateOfBirth: dto.dateOfBirth,
      addressLine1: dto.addressLine1,
      addressLine2: dto.addressLine2?.trim() || null,
      landmark: dto.landmark?.trim() || null,
      postalCode: dto.postalCode,
      isMarried: dto.isMarried,
      marriageDate: dto.isMarried ? dto.marriageDate ?? null : null,
      phoneVerifiedAt: new Date(),
    });

    const saved = await this.userRepository.save(user);
    await this.bankDetailsService.createForHolder(saved.id, BankHolderType.USER, {
      accountHolderName: dto.accountHolderName,
      accountNumber: dto.accountNumber,
      ifscCode: dto.ifscCode,
    });
    return this.toSafeUser(saved);
  }

  async login(
    loginUserDto: LoginUserDto,
  ): Promise<AuthTokenResponse<{ user: SafeUser }>> {
    const user = await this.userRepository.findOne({
      where: { phoneNumber: loginUserDto.phoneNumber },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('auth.invalidUserPhoneNumberOrPassword');
    }

    const isPasswordValid = await bcrypt.compare(
      loginUserDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('auth.invalidUserPhoneNumberOrPassword');
    }

    const accessToken = this.signToken(user);
    return { accessToken, user: this.toSafeUser(user) };
  }

  async logout(userId: string): Promise<ApiMessageResponse> {
    await this.incrementTokenVersion(userId);
    return { message: this.i18n.t('auth.logoutSuccess') };
  }

  async findMe(userId: string): Promise<SafeUser> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(this.i18n.t('user.notFound', { id: userId }));
    }
    return this.toSafeUser(user);
  }

  async findAgentsByLocation(query: ListAgentsQueryDto): Promise<SafeAgent[]> {
    const { stateName, cityName } = await this.resolveLocationNames(
      query.stateId,
      query.cityId,
    );

    return this.agentRepository.find({
      where: {
        state: stateName,
        city: cityName,
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        middleName: true,
        lastName: true,
      },
      order: { firstName: 'ASC', lastName: 'ASC' },
    });
  }

  async updateAgent(
    userId: string,
    dto: UpdateUserAgentDto,
  ): Promise<SafeUser> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(this.i18n.t('user.notFound', { id: userId }));
    }

    const agent = await this.agentRepository.findOne({
      where: { id: dto.agentId },
    });
    if (!agent) {
      throw new NotFoundException(
        this.i18n.t('user.agentNotFound', { id: dto.agentId }),
      );
    }

    if (!agent.isActive) {
      throw new BadRequestException('user.agentInactive');
    }

    const { stateName, cityName } = await this.resolveLocationNames(
      dto.stateId,
      dto.cityId,
    );

    if (agent.state !== stateName || agent.city !== cityName) {
      throw new BadRequestException('user.agentLocationMismatch');
    }

    user.agentId = dto.agentId;
    const saved = await this.userRepository.save(user);
    return this.toSafeUser(saved);
  }

  private async resolveLocationNames(
    stateId: number,
    cityId: number,
  ): Promise<UserLocationNames> {
    const state = await this.stateRepository.findOne({
      where: { id: stateId },
    });
    if (!state) {
      throw new NotFoundException(
        this.i18n.t('location.stateNotFound', { id: stateId }),
      );
    }

    const city = await this.cityRepository.findOne({
      where: { id: cityId, stateId },
    });
    if (!city) {
      throw new NotFoundException(
        this.i18n.t('location.cityNotFound', { id: cityId }),
      );
    }

    return { stateName: state.name, cityName: city.name };
  }

  private toSafeUser(user: User): SafeUser {
    const { agent, password, tokenVersion, referredBy, ...safeUser } = user;
    return safeUser;
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  private signToken(user: User): string {
    const jwtSecret = process.env.JWT_SECRET || 'dev-secret-key-change-me';
    const expiresIn = process.env.JWT_EXPIRES_IN || '1d';

    return jwt.sign(
      { id: user.id, type: 'user', tokenVersion: user.tokenVersion },
      jwtSecret,
      { expiresIn } as jwt.SignOptions,
    );
  }

  private async incrementTokenVersion(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('auth.invalidOrExpiredToken');
    }
    user.tokenVersion += 1;
    await this.userRepository.save(user);
  }
}
