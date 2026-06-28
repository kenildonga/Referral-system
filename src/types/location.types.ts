import { State } from '../entities/states.entity';
import { City } from '../entities/cities.entity';

export type StateListItem = Pick<State, 'id' | 'name' | 'stateCode'>;

export type CityListItem = Pick<City, 'id' | 'name' | 'stateId' | 'shortCode'>;