import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { State } from '../entities/states.entity';
import { City } from '../entities/cities.entity';
import { I18nService } from '../i18n/i18n.service';
import type { CityListItem, StateListItem } from '../types/location.types';

@Injectable()
export class IndexService {
  constructor(
    @InjectRepository(State)
    private readonly stateRepository: Repository<State>,
    @InjectRepository(City)
    private readonly cityRepository: Repository<City>,
    private readonly i18n: I18nService,
  ) {}

  async findAllStates(): Promise<StateListItem[]> {
    return this.stateRepository.find({
      select: { id: true, name: true, stateCode: true },
      order: { name: 'ASC' },
    });
  }

  async findCitiesByState(
    stateId: number,
  ): Promise<CityListItem[]> {
    const state = await this.stateRepository.findOne({
      where: { id: stateId },
    });
    if (!state) {
      throw new NotFoundException(
        this.i18n.t('location.stateNotFound', { id: stateId }),
      );
    }

    return this.cityRepository.find({
      where: { stateId },
      select: { id: true, name: true, stateId: true, shortCode: true },
      order: { name: 'ASC' },
    });
  }
}
