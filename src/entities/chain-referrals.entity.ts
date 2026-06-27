import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Chain } from './chains.entity';
import { Agent } from './agents.entity';
import { User } from './users.entity';

export enum ChainAssignType {
  AUTO = 'auto',
  MANUAL = 'manual',
}

@Entity('chain_referrals')
export class ChainReferral {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  chainId: string;

  @ManyToOne(() => Chain)
  @JoinColumn({ name: 'chainId' })
  chain: Chain;

  @Column({ type: 'uuid' })
  agentId: string;

  @ManyToOne(() => Agent)
  @JoinColumn({ name: 'agentId' })
  agent: Agent;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'int' })
  position: number;

  @Column({ type: 'enum', enum: ChainAssignType })
  assignType: ChainAssignType;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
