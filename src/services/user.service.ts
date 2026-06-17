import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsSelect } from 'typeorm';
import { User } from '../entities/users.entity';
import { Agent } from '../entities/agents.entity';
import { State } from '../entities/states.entity';
import { City } from '../entities/cities.entity';
import {
  FillUserFormDto,
  UpdateUserAgentDto,
  ListAgentsQueryDto,
} from '../dto/user.dto';
import { I18nService } from '../i18n/i18n.service';

type SafeUser = Omit<User, 'agent'>;

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
  ) {}

  async fillForm(dto: FillUserFormDto): Promise<SafeUser> {
    const user = this.userRepository.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      phoneNumber: dto.phoneNumber,
      email: dto.email,
      agentId: null,
    });

    const saved = await this.userRepository.save(user);
    return this.toSafeUser(saved);
  }

  async findAllStates(): Promise<
    Pick<State, 'id' | 'name' | 'stateCode'>[]
  > {
    return this.stateRepository.find({
      select: { id: true, name: true, stateCode: true },
      order: { name: 'ASC' },
    });
  }

  async findCitiesByState(
    stateId: number,
  ): Promise<Pick<City, 'id' | 'name' | 'stateId'>[]> {
    const state = await this.stateRepository.findOne({ where: { id: stateId } });
    if (!state) {
      throw new NotFoundException(
        this.i18n.t('location.stateNotFound', { id: stateId }),
      );
    }

    return this.cityRepository.find({
      where: { stateId },
      select: { id: true, name: true, stateId: true },
      order: { name: 'ASC' },
    });
  }

  async findAgentsByLocation(
    query: ListAgentsQueryDto,
  ): Promise<SafeAgent[]> {
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
      select: SAFE_AGENT_SELECT,
      order: { name: 'ASC' },
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
  ): Promise<{ stateName: string; cityName: string }> {
    const state = await this.stateRepository.findOne({ where: { id: stateId } });
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
    const { agent, ...safeUser } = user;
    return safeUser;
  }
}
