import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsSelect } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { Agent } from '../entities/agents.entity';
import {
  CreateAgentDto,
  UpdateAgentDto,
  UpdateAgentStatusDto,
  LoginAgentDto,
  ChangeAgentPasswordDto,
} from '../dto/agent.dto';
import { I18nService } from '../i18n/i18n.service';

type SafeAgent = Omit<Agent, 'password' | 'tokenVersion' | 'createdBy'>;

const SAFE_AGENT_SELECT: FindOptionsSelect<Agent> = {
  id: true,
  agentLoginId: true,
  name: true,
  phone: true,
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
const MAX_LOGIN_ID_RETRIES = 5;

@Injectable()
export class AgentService {
  constructor(
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    private readonly i18n: I18nService,
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

    const plainPassword = this.generatePassword();
    const agentLoginId = await this.generateUniqueAgentLoginId();

    const agent = this.agentRepository.create({
      agentLoginId,
      password: await this.hashPassword(plainPassword),
      name: createAgentDto.name,
      phone: createAgentDto.phone,
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

    if (updateAgentDto.name !== undefined) {
      agent.name = updateAgentDto.name;
    }

    if (updateAgentDto.phone !== undefined) {
      agent.phone = updateAgentDto.phone;
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

  private toSafeAgent(agent: Agent): SafeAgent {
    const { password, tokenVersion, createdBy, ...safeAgent } = agent;
    return safeAgent;
  }
}
