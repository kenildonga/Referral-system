import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chain } from '../entities/chains.entity';
import { CreateChainDto, UpdateChainDto } from '../dto/chain.dto';
import { I18nService } from '../i18n/i18n.service';
import type { ApiMessageResponse } from '../types/api-response.types';

@Injectable()
export class ChainService {
  constructor(
    @InjectRepository(Chain)
    private readonly chainRepository: Repository<Chain>,
    private readonly i18n: I18nService,
  ) {}

  private async findByIdOrFail(id: string): Promise<Chain> {
    const chain = await this.chainRepository.findOne({ where: { id } });
    if (!chain) {
      throw new NotFoundException(this.i18n.t('chain.notFound', { id }));
    }
    return chain;
  }

  async create(createChainDto: CreateChainDto): Promise<Chain> {
    const chain = this.chainRepository.create(createChainDto);
    return this.chainRepository.save(chain);
  }

  async findAll(): Promise<Chain[]> {
    return this.chainRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Chain> {
    return this.findByIdOrFail(id);
  }

  async update(id: string, updateChainDto: UpdateChainDto): Promise<Chain> {
    const chain = await this.findByIdOrFail(id);

    if (updateChainDto.name !== undefined) {
      chain.name = updateChainDto.name;
    }

    return this.chainRepository.save(chain);
  }

  async remove(id: string): Promise<ApiMessageResponse> {
    const chain = await this.findByIdOrFail(id);
    await this.chainRepository.remove(chain);
    return { message: this.i18n.t('chain.deletedSuccess') };
  }
}
