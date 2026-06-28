import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsSelect } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { Agent } from '../entities/agents.entity';
import { User } from '../entities/users.entity';
import { Chain } from '../entities/chains.entity';
import {
  ChainReferral,
  ChainAssignType,
} from '../entities/chain-referrals.entity';
import {
  CreateAgentDto,
  UpdateAgentDto,
  UpdateAgentStatusDto,
  LoginAgentDto,
  ChangeAgentPasswordDto,
  SignUpAgentDto,
  SendAgentRegistrationOtpDto,
  UpdateAgentProfileDto,
} from '../dto/agent.dto';
import { UpdateUserDto, UpdateUserStatusDto, ListMyUsersQueryDto } from '../dto/user.dto';
import { I18nService } from '../i18n/i18n.service';
import { UserStatus, BankHolderType } from '../entities/enum';
import { FormService } from './form.service';
import { BankDetailsService } from './bank-details.service';
import { formatPersonName, normalizeMiddleName } from '../common/utils/name.util';
import { OtpService } from '../common/helpers/otp.service';

type SafeAgent = Omit<Agent, 'password' | 'tokenVersion' | 'createdBy'>;
type SafeUser = Omit<User, 'agent' | 'password' | 'referredBy'>;
type SafeUserResponse = SafeUser & { referredByName: string | null };
type UserWithFormStats = SafeUserResponse & {
  filledFormsCount: number;
  totalFormsCount: number;
};

const SAFE_USER_SELECT: FindOptionsSelect<User> = {
  id: true,
  agentId: true,
  firstName: true,
  middleName: true,
  lastName: true,
  phoneNumber: true,
  email: true,
  status: true,
  note: true,
  referralCode: true,
  referredByUserId: true,
  createdAt: true,
  updatedAt: true,
};

const SAFE_AGENT_SELECT: FindOptionsSelect<Agent> = {
  id: true,
  agentLoginId: true,
  firstName: true,
  middleName: true,
  lastName: true,
  phoneNumber: true,
  email: true,
  isActive: true,
  state: true,
  city: true,
  lastLogin: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
};

const AGENT_LOGIN_ID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const REFERRAL_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX_LOGIN_ID_RETRIES = 5;
const MAX_REFERRAL_CODE_RETRIES = 5;

@Injectable()
export class AgentService {
  constructor(
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Chain)
    private readonly chainRepository: Repository<Chain>,
    @InjectRepository(ChainReferral)
    private readonly chainReferralRepository: Repository<ChainReferral>,
    private readonly formService: FormService,
    private readonly i18n: I18nService,
    private readonly otpService: OtpService,
    private readonly bankDetailsService: BankDetailsService,
  ) {}

  // --- Agent Auth ---

  async login(
    loginAgentDto: LoginAgentDto,
  ): Promise<{ accessToken: string; agent: SafeAgent }> {
    const agent = await this.agentRepository.findOne({
      where: { agentLoginId: loginAgentDto.agentLoginId },
    });

    if (!agent || !agent.isActive) {
      throw new UnauthorizedException('auth.invalidAgentLoginIdOrPassword');
    }

    const isPasswordValid = await bcrypt.compare(
      loginAgentDto.password,
      agent.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('auth.invalidAgentLoginIdOrPassword');
    }

    const accessToken = this.signToken(agent);
    agent.lastLogin = new Date();
    await this.agentRepository.save(agent);

    return { accessToken, agent: this.toSafeAgent(agent) };
  }

  async logout(agentId: string): Promise<{ message: string }> {
    await this.incrementTokenVersion(agentId);
    return { message: this.i18n.t('auth.logoutSuccess') };
  }

  async changePassword(
    agentId: string,
    changeAgentPasswordDto: ChangeAgentPasswordDto,
  ): Promise<{ message: string }> {
    const agent = await this.agentRepository.findOne({
      where: { id: agentId },
    });
    if (!agent) {
      throw new UnauthorizedException('auth.invalidOrExpiredToken');
    }

    const isCurrentValid = await bcrypt.compare(
      changeAgentPasswordDto.currentPassword,
      agent.password,
    );
    if (!isCurrentValid) {
      throw new UnauthorizedException('auth.currentPasswordIncorrect');
    }

    await this.updatePassword(agent, changeAgentPasswordDto.newPassword);
    return { message: this.i18n.t('auth.passwordChangedSuccess') };
  }

  async sendRegistrationOtp(
    dto: SendAgentRegistrationOtpDto,
  ): Promise<{ message: string }> {
    await this.assertPhoneAvailableForRegistration(dto.phoneNumber);
    await this.otpService.issuePhoneOtp(dto.phoneNumber);
    return { message: 'OTP sent successfully' };
  }

  private async assertPhoneAvailableForRegistration(
    phoneNumber: string,
  ): Promise<void> {
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

  async signUp(
    signUpAgentDto: SignUpAgentDto,
  ): Promise<{ accessToken: string; agent: SafeAgent }> {
    await this.assertPhoneAvailableForRegistration(signUpAgentDto.phoneNumber);
    await this.otpService.verifyPhoneOtp(
      signUpAgentDto.phoneNumber,
      signUpAgentDto.otp,
    );

    const existingEmail = await this.agentRepository.findOne({
      where: { email: signUpAgentDto.email },
    });
    if (existingEmail) {
      throw new ConflictException('agent.emailExists');
    }

    const agentLoginId = await this.generateUniqueAgentLoginId();

    const agent = this.agentRepository.create({
      agentLoginId,
      password: await this.hashPassword(signUpAgentDto.password),
      firstName: signUpAgentDto.firstName,
      middleName: normalizeMiddleName(signUpAgentDto.middleName),
      lastName: signUpAgentDto.lastName,
      phoneNumber: signUpAgentDto.phoneNumber,
      email: signUpAgentDto.email,
      state: signUpAgentDto.state,
      city: signUpAgentDto.city,
      isActive: true,
      tokenVersion: 0,
      createdById: null,
      phoneVerifiedAt: new Date(),
    });

    const saved = await this.agentRepository.save(agent);
    await this.bankDetailsService.createForHolder(
      saved.id,
      BankHolderType.AGENT,
      {
        accountHolderName: signUpAgentDto.accountHolderName,
        accountNumber: signUpAgentDto.accountNumber,
        ifscCode: signUpAgentDto.ifscCode,
      },
    );

    const accessToken = this.signToken(saved);
    saved.lastLogin = new Date();
    await this.agentRepository.save(saved);

    return { accessToken, agent: this.toSafeAgent(saved) };
  }

  async getProfile(agentId: string): Promise<SafeAgent> {
    return this.findOne(agentId);
  }

  async updateProfile(
    agentId: string,
    updateAgentProfileDto: UpdateAgentProfileDto,
  ): Promise<SafeAgent> {
    return this.update(agentId, updateAgentProfileDto);
  }

  async findMyUsers(
    agentId: string,
    query?: ListMyUsersQueryDto,
  ): Promise<UserWithFormStats[]> {
    const users = await this.userRepository.find({
      where: {
        agentId,
        ...(query?.status !== undefined ? { status: query.status } : {}),
      },
      select: SAFE_USER_SELECT,
      relations: { referredBy: true },
      order: { createdAt: 'DESC' },
    });

    const userIds = users.map((user) => user.id);
    const formStats = await this.formService.getUserFormStatsForUsers(userIds);

    return users.map((user) => {
      const stats = formStats.get(user.id) ?? { filled: 0, total: 0 };
      return {
        ...this.toSafeUserResponse(user),
        filledFormsCount: stats.filled,
        totalFormsCount: stats.total,
      };
    });
  }

  async findMyUserById(agentId: string, userId: string): Promise<SafeUserResponse> {
    const user = await this.findAssignedUserOrFail(agentId, userId, {
      loadReferrer: true,
    });
    return this.toSafeUserResponse(user);
  }

  async getApprovalInfo(
    agentId: string,
    userId: string,
  ): Promise<{
    requiresChainSelection: boolean;
    suggestedChainId: string | null;
    chains: Chain[];
  }> {
    const user = await this.findAssignedUserOrFail(agentId, userId);
    const chains = await this.chainRepository.find({ order: { name: 'ASC' } });

    if (!user.referredByUserId) {
      return { requiresChainSelection: true, suggestedChainId: null, chains };
    }

    const referrerChainReferral = await this.chainReferralRepository.findOne({
      where: { userId: user.referredByUserId },
    });

    if (!referrerChainReferral) {
      return { requiresChainSelection: true, suggestedChainId: null, chains };
    }

    const latestInChain = await this.chainReferralRepository.findOne({
      where: { chainId: referrerChainReferral.chainId },
      order: { position: 'DESC' },
    });

    if (latestInChain && latestInChain.userId === user.referredByUserId) {
      return { requiresChainSelection: false, suggestedChainId: referrerChainReferral.chainId, chains };
    }

    return { requiresChainSelection: true, suggestedChainId: referrerChainReferral.chainId, chains };
  }

  async updateMyUser(
    agentId: string,
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<SafeUserResponse> {
    const user = await this.findAssignedUserOrFail(agentId, userId);

    if (updateUserDto.firstName !== undefined) {
      user.firstName = updateUserDto.firstName;
    }

    if (updateUserDto.lastName !== undefined) {
      user.lastName = updateUserDto.lastName;
    }

    if (updateUserDto.middleName !== undefined) {
      user.middleName = normalizeMiddleName(updateUserDto.middleName);
    }

    if (
      updateUserDto.phoneNumber !== undefined &&
      updateUserDto.phoneNumber !== user.phoneNumber
    ) {
      const existing = await this.userRepository.findOne({
        where: { phoneNumber: updateUserDto.phoneNumber },
        select: { id: true },
      });
      if (existing) {
        throw new ConflictException('user.phoneNumberExists');
      }
      user.phoneNumber = updateUserDto.phoneNumber;
    }

    if (
      updateUserDto.email !== undefined &&
      updateUserDto.email !== user.email
    ) {
      const existing = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
        select: { id: true },
      });
      if (existing) {
        throw new ConflictException('user.emailExists');
      }
      user.email = updateUserDto.email;
    }

    if (updateUserDto.password !== undefined) {
      user.password = await this.hashPassword(updateUserDto.password);
    }

    const saved = await this.userRepository.save(user);
    return this.toSafeUserResponse(saved);
  }

  async removeMyUser(
    agentId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const user = await this.findAssignedUserOrFail(agentId, userId);
    await this.userRepository.remove(user);
    return { message: this.i18n.t('user.deletedSuccess') };
  }

  async updateMyUserStatus(
    agentId: string,
    userId: string,
    dto: UpdateUserStatusDto,
  ): Promise<SafeUserResponse> {
    const user = await this.findAssignedUserOrFail(agentId, userId);

    if (dto.status === UserStatus.APPROVED) {
      user.status = UserStatus.APPROVED;
      user.note = null;
      if (!user.referralCode) {
        user.referralCode = await this.generateUniqueReferralCode();
      }

      const saved = await this.userRepository.save(user);
      await this.assignChainOnApproval(agentId, saved, dto.chainId ?? null);
      return this.toSafeUserResponse(saved);
    } else if (dto.status === UserStatus.REJECTED) {
      if (!dto.note?.trim()) {
        throw new BadRequestException('user.noteRequiredForRejection');
      }
      user.status = UserStatus.REJECTED;
      user.note = dto.note.trim();
    } else {
      throw new BadRequestException('user.invalidStatusTransition');
    }

    const saved = await this.userRepository.save(user);
    return this.toSafeUserResponse(saved);
  }

  private async assignChainOnApproval(
    agentId: string,
    user: User,
    chainIdFromDto: string | null,
  ): Promise<void> {
    if (!user.referredByUserId) {
      if (!chainIdFromDto) {
        throw new BadRequestException('user.chainIdRequiredForApproval');
      }
      await this.validateChainExists(chainIdFromDto);
      const position = await this.getNextPosition(chainIdFromDto);
      await this.chainReferralRepository.save(
        this.chainReferralRepository.create({
          chainId: chainIdFromDto,
          agentId,
          userId: user.id,
          position,
          assignType: ChainAssignType.MANUAL,
        }),
      );
      return;
    }

    const referrerChainReferral = await this.chainReferralRepository.findOne({
      where: { userId: user.referredByUserId },
    });

    if (!referrerChainReferral) {
      if (!chainIdFromDto) {
        throw new BadRequestException('user.chainIdRequiredForApproval');
      }
      await this.validateChainExists(chainIdFromDto);
      const position = await this.getNextPosition(chainIdFromDto);
      await this.chainReferralRepository.save(
        this.chainReferralRepository.create({
          chainId: chainIdFromDto,
          agentId,
          userId: user.id,
          position,
          assignType: ChainAssignType.MANUAL,
        }),
      );
      return;
    }

    const latestInChain = await this.chainReferralRepository.findOne({
      where: { chainId: referrerChainReferral.chainId },
      order: { position: 'DESC' },
    });

    if (latestInChain && latestInChain.userId === user.referredByUserId) {
      const position = referrerChainReferral.position + 1;
      await this.chainReferralRepository.save(
        this.chainReferralRepository.create({
          chainId: referrerChainReferral.chainId,
          agentId,
          userId: user.id,
          position,
          assignType: ChainAssignType.AUTO,
        }),
      );
      return;
    }

    if (!chainIdFromDto) {
      throw new BadRequestException('user.chainIdRequiredForApproval');
    }
    await this.validateChainExists(chainIdFromDto);
    const position = await this.getNextPosition(chainIdFromDto);
    const assignType =
      chainIdFromDto === referrerChainReferral.chainId
        ? ChainAssignType.AUTO
        : ChainAssignType.MANUAL;
    await this.chainReferralRepository.save(
      this.chainReferralRepository.create({
        chainId: chainIdFromDto,
        agentId,
        userId: user.id,
        position,
        assignType,
      }),
    );
  }

  private async validateChainExists(chainId: string): Promise<void> {
    const chain = await this.chainRepository.findOne({
      where: { id: chainId },
      select: { id: true },
    });
    if (!chain) {
      throw new NotFoundException(this.i18n.t('chain.notFound', { id: chainId }));
    }
  }

  private async getNextPosition(chainId: string): Promise<number> {
    const latest = await this.chainReferralRepository.findOne({
      where: { chainId },
      order: { position: 'DESC' },
      select: { position: true },
    });
    return latest ? latest.position + 1 : 1;
  }

  async getMyChainReferrals(agentId: string) {
    const referrals = await this.chainReferralRepository.find({
      where: { agentId },
      relations: { chain: true, user: { referredBy: true } },
      order: { position: 'ASC' },
    });

    const chainMap = new Map<string, { id: string; name: string; users: Array<{
      id: string;
      firstName: string;
      middleName: string | null;
      lastName: string;
      position: number;
      assignType: string;
      referredByName: string | null;
    }> }>();

    for (const ref of referrals) {
      if (!chainMap.has(ref.chainId)) {
        chainMap.set(ref.chainId, {
          id: ref.chain.id,
          name: ref.chain.name,
          users: [],
        });
      }
      const referredByName = ref.user.referredBy
        ? formatPersonName(ref.user.referredBy)
        : null;
      chainMap.get(ref.chainId)!.users.push({
        id: ref.user.id,
        firstName: ref.user.firstName,
        middleName: ref.user.middleName,
        lastName: ref.user.lastName,
        position: ref.position,
        assignType: ref.assignType,
        referredByName,
      });
    }

    return { chains: Array.from(chainMap.values()) };
  }

  // --- Admin Management ---

  async create(
    createAgentDto: CreateAgentDto,
    createdById: string,
  ): Promise<{
    agent: SafeAgent;
    credentials: { agentLoginId: string; password: string };
  }> {
    if (createAgentDto.email) {
      const existingEmail = await this.agentRepository.findOne({
        where: { email: createAgentDto.email },
      });
      if (existingEmail) {
        throw new ConflictException('agent.emailExists');
      }
    }

    if (createAgentDto.phoneNumber) {
      const existingPhoneNumber = await this.agentRepository.findOne({
        where: { phoneNumber: createAgentDto.phoneNumber },
      });
      if (existingPhoneNumber) {
        throw new ConflictException('agent.phoneNumberExists');
      }
    }

    const plainPassword = this.generatePassword();
    const agentLoginId = await this.generateUniqueAgentLoginId();

    const agent = this.agentRepository.create({
      agentLoginId,
      password: await this.hashPassword(plainPassword),
      firstName: createAgentDto.firstName,
      middleName: normalizeMiddleName(createAgentDto.middleName),
      lastName: createAgentDto.lastName,
      phoneNumber: createAgentDto.phoneNumber,
      email: createAgentDto.email,
      state: createAgentDto.state,
      city: createAgentDto.city,
      isActive: true,
      tokenVersion: 0,
      createdById,
    });

    const saved = await this.agentRepository.save(agent);

    return {
      agent: this.toSafeAgent(saved),
      credentials: { agentLoginId, password: plainPassword },
    };
  }

  async findAll(): Promise<SafeAgent[]> {
    return this.agentRepository.find({ select: SAFE_AGENT_SELECT });
  }

  async findOne(id: string): Promise<SafeAgent> {
    const agent = await this.agentRepository.findOne({
      where: { id },
      select: SAFE_AGENT_SELECT,
    });
    if (!agent) {
      throw new NotFoundException(this.i18n.t('agent.notFound', { id }));
    }
    return agent;
  }

  async update(id: string, updateAgentDto: UpdateAgentDto): Promise<SafeAgent> {
    const agent = await this.findByIdOrFail(id);

    if (updateAgentDto.email && updateAgentDto.email !== agent.email) {
      const existing = await this.agentRepository.findOne({
        where: { email: updateAgentDto.email },
      });
      if (existing) {
        throw new ConflictException('agent.emailExists');
      }
      agent.email = updateAgentDto.email;
    }

    if (
      updateAgentDto.phoneNumber &&
      updateAgentDto.phoneNumber !== agent.phoneNumber
    ) {
      const existing = await this.agentRepository.findOne({
        where: { phoneNumber: updateAgentDto.phoneNumber },
      });
      if (existing) {
        throw new ConflictException('agent.phoneNumberExists');
      }
      agent.phoneNumber = updateAgentDto.phoneNumber;
    }

    if (updateAgentDto.firstName !== undefined) {
      agent.firstName = updateAgentDto.firstName;
    }

    if (updateAgentDto.lastName !== undefined) {
      agent.lastName = updateAgentDto.lastName;
    }

    if (updateAgentDto.middleName !== undefined) {
      agent.middleName = normalizeMiddleName(updateAgentDto.middleName);
    }

    if (updateAgentDto.state !== undefined) {
      agent.state = updateAgentDto.state;
    }

    if (updateAgentDto.city !== undefined) {
      agent.city = updateAgentDto.city;
    }

    const saved = await this.agentRepository.save(agent);
    return this.toSafeAgent(saved);
  }

  async remove(id: string): Promise<{ message: string }> {
    const agent = await this.findByIdOrFail(id);
    await this.agentRepository.remove(agent);
    return { message: this.i18n.t('agent.deletedSuccess') };
  }

  async updateStatus(
    id: string,
    updateAgentStatusDto: UpdateAgentStatusDto,
  ): Promise<SafeAgent> {
    const agent = await this.findByIdOrFail(id);
    agent.isActive = updateAgentStatusDto.isActive;
    const saved = await this.agentRepository.save(agent);
    return this.toSafeAgent(saved);
  }

  async resetPassword(id: string): Promise<{
    message: string;
    credentials: { agentLoginId: string; password: string };
  }> {
    const agent = await this.findByIdOrFail(id);
    const plainPassword = this.generatePassword();
    await this.updatePassword(agent, plainPassword);

    return {
      message: this.i18n.t('auth.passwordResetSuccess'),
      credentials: {
        agentLoginId: agent.agentLoginId,
        password: plainPassword,
      },
    };
  }

  // --- Private helpers ---

  private async findByIdOrFail(id: string): Promise<Agent> {
    const agent = await this.agentRepository.findOne({ where: { id } });
    if (!agent) {
      throw new NotFoundException(this.i18n.t('agent.notFound', { id }));
    }
    return agent;
  }

  private async generateUniqueReferralCode(): Promise<string> {
    for (let attempt = 0; attempt < MAX_REFERRAL_CODE_RETRIES; attempt++) {
      const referralCode = `REF${this.randomReferralChars(6)}`;
      const existing = await this.userRepository.findOne({
        where: { referralCode },
        select: { id: true },
      });
      if (!existing) {
        return referralCode;
      }
    }
    throw new ConflictException('user.referralCodeGenerationFailed');
  }

  private randomReferralChars(length: number): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += REFERRAL_CODE_CHARS.charAt(
        Math.floor(Math.random() * REFERRAL_CODE_CHARS.length),
      );
    }
    return result;
  }

  private async generateUniqueAgentLoginId(): Promise<string> {
    for (let attempt = 0; attempt < MAX_LOGIN_ID_RETRIES; attempt++) {
      const agentLoginId = `AGT-${this.randomChars(6)}`;
      const existing = await this.agentRepository.findOne({
        where: { agentLoginId },
      });
      if (!existing) {
        return agentLoginId;
      }
    }
    throw new ConflictException('agent.loginIdGenerationFailed');
  }

  private randomChars(length: number): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += AGENT_LOGIN_ID_CHARS.charAt(
        Math.floor(Math.random() * AGENT_LOGIN_ID_CHARS.length),
      );
    }
    return result;
  }

  private generatePassword(): string {
    const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const all = letters + numbers;

    let password = '';
    password += letters.charAt(Math.floor(Math.random() * letters.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));

    for (let i = 2; i < 12; i++) {
      password += all.charAt(Math.floor(Math.random() * all.length));
    }

    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }

  private signToken(agent: Agent): string {
    const jwtSecret = process.env.JWT_SECRET || 'dev-secret-key-change-me';
    const expiresIn = process.env.JWT_EXPIRES_IN || '1d';

    return jwt.sign(
      { id: agent.id, type: 'agent', tokenVersion: agent.tokenVersion },
      jwtSecret,
      { expiresIn } as jwt.SignOptions,
    );
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  private async updatePassword(
    agent: Agent,
    plainPassword: string,
  ): Promise<void> {
    agent.password = await this.hashPassword(plainPassword);
    agent.tokenVersion += 1;
    await this.agentRepository.save(agent);
  }

  private async incrementTokenVersion(agentId: string): Promise<void> {
    const agent = await this.agentRepository.findOne({
      where: { id: agentId },
    });
    if (!agent) {
      throw new UnauthorizedException('auth.invalidOrExpiredToken');
    }
    agent.tokenVersion += 1;
    await this.agentRepository.save(agent);
  }

  private async findAssignedUserOrFail(
    agentId: string,
    userId: string,
    options?: { loadReferrer?: boolean },
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId, agentId },
      ...(options?.loadReferrer ? { relations: { referredBy: true } } : {}),
    });
    if (!user) {
      throw new NotFoundException(this.i18n.t('user.notFound', { id: userId }));
    }
    return user;
  }

  private toSafeAgent(agent: Agent): SafeAgent {
    const { password, tokenVersion, createdBy, ...safeAgent } = agent;
    return safeAgent;
  }

  private toSafeUserResponse(user: User): SafeUserResponse {
    const { agent, password, referredBy, ...safeUser } = user;
    const referredByName = referredBy
      ? formatPersonName(referredBy)
      : null;
    return { ...safeUser, referredByName };
  }
}
