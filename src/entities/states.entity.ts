import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { City } from './cities.entity';

@Entity('states')
export class State {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'state_code', type: 'varchar', length: 10, unique: true })
  stateCode: string;

  @OneToMany(() => City, (city) => city.state)
  cities: City[];
}
