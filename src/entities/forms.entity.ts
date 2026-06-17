import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Admin } from './admins.entity';
import { FormResponse } from './form-responses.entity';
import { SubmissionUserType } from './enum';

@Entity('forms')
export class Form {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'jsonb', default: [] })
  fields: Record<string, unknown>[];

  @Column({ type: 'boolean', default: true })
  isPublished: boolean;

  @Column({
    type: 'enum',
    enum: SubmissionUserType,
  })
  submissionUserType: SubmissionUserType;

  @Column({ type: 'uuid' })
  createdById: string;

  @ManyToOne(() => Admin)
  @JoinColumn({ name: 'createdById' })
  createdBy: Admin;

  @OneToMany(() => FormResponse, (response) => response.form)
  responses: FormResponse[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt: Date | null;
}
