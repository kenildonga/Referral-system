import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Form } from './forms.entity';
import { SubmissionUserType } from './enum';

@Entity('form_responses')
export class FormResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  formId: string;

  @ManyToOne(() => Form, (form) => form.responses)
  @JoinColumn({ name: 'formId' })
  form: Form;

  @Column({ type: 'uuid', nullable: true })
  submitterId: string | null;

  @Column({
    type: 'enum',
    enum: SubmissionUserType,
    nullable: true,
  })
  submitterType: SubmissionUserType | null;

  @Column({ type: 'jsonb' })
  answers: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamp' })
  submittedAt: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt: Date | null;
}
