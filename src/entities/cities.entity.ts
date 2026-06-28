import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { State } from './states.entity';

@Entity('cities')
@Unique('uq_cities_shortCode', ['shortCode'])
export class City {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'state_id', type: 'int' })
  stateId: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 3, nullable: true, default: null })
  shortCode: string | null;

  @ManyToOne(() => State, (state) => state.cities, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'state_id' })
  state: State;
}
