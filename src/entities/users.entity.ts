import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Agent } from './agents.entity';
import { UserStatus } from './enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true, default: null })
  agentId: string | null;

  @ManyToOne(() => Agent, { nullable: true })
  @JoinColumn({ name: 'agentId' })
  agent: Agent | null;

  @Column({ type: 'varchar', length: 255 })
  firstName: string;

  @Column({ type: 'varchar', length: 255, nullable: true, default: null })
  middleName: string | null;

  @Column({ type: 'varchar', length: 255 })
  lastName: string;

  @Column({ type: 'varchar', length: 10 })
  phoneNumber: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true, default: null })
  password: string | null;

  @Column({ type: 'int', default: 0 })
  tokenVersion: number;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING,
  })
  status: UserStatus;

  @Column({ type: 'text', nullable: true, default: null })
  note: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true, default: null, unique: true })
  referralCode: string | null;

  @Column({ type: 'uuid', nullable: true, default: null })
  referredByUserId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'referredByUserId' })
  referredBy: User | null;

  @Column({ type: 'date', nullable: true, default: null })
  dateOfBirth: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true, default: null })
  addressLine1: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, default: null })
  addressLine2: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, default: null })
  landmark: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true, default: null })
  postalCode: string | null;

  @Column({ type: 'boolean', default: false })
  isMarried: boolean;

  @Column({ type: 'date', nullable: true, default: null })
  marriageDate: Date | null;

  @Column({ type: 'timestamp', nullable: true, default: null })
  phoneVerifiedAt: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
