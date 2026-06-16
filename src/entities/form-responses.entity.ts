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

@Entity('form_responses')
export class FormResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  formId: string;

  @ManyToOne(() => Form, (form) => form.responses)
  @JoinColumn({ name: 'formId' })
  form: Form;

  @Column({ type: 'jsonb' })
  answers: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamp' })
  submittedAt: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt: Date | null;
}
