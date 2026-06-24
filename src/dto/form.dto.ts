import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { SubmissionUserType } from '../entities/enum';

const FieldValidationSchema = z.object({
  required: z.boolean().optional(),
  minLength: z.number().int().min(0).optional(),
  maxLength: z.number().int().min(0).optional(),
  pattern: z.string().optional(),
  allowedFileTypes: z.array(z.string()).optional(),
  maxFileSizeMB: z.number().positive().optional(),
  errorMessage: z.string().optional(),
});

const FieldTypeSchema = z.enum([
  'text',
  'textarea',
  'dropdown',
  'multi_dropdown',
  'radio',
  'multi_radio',
  'checkbox',
  'checkbox_group',
  'file',
]);

const FormFieldSchema = z.object({
  id: z.string().min(1, 'validation.fieldId.required'),
  type: FieldTypeSchema,
  label: z.string().min(1, 'validation.label.required'),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(),
  validation: FieldValidationSchema.optional(),
});

export const CreateFormSchema = z.object({
  title: z.string().min(1, 'validation.title.required').max(255),
  description: z.string().max(2000).optional(),
  fields: z.array(FormFieldSchema).default([]),
  isPublished: z.boolean().default(true),
  submissionUserType: z.nativeEnum(SubmissionUserType),
});

export const UpdateFormSchema = z
  .object({
    title: z.string().min(1, 'validation.title.required').max(255).optional(),
    description: z.string().max(2000).optional(),
    fields: z.array(FormFieldSchema).optional(),
    isPublished: z.boolean().optional(),
    submissionUserType: z.nativeEnum(SubmissionUserType).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'validation.atLeastOneField',
  });

const StoredFileMetaSchema = z.object({
  kind: z.literal('file'),
  key: z.string().min(1, 'validation.fileKey.required'),
  name: z.string(),
  size: z.number().int().nonnegative(),
  type: z.string(),
});

const StoredAnswerValueSchema = z.union([
  z.string(),
  z.array(z.string()),
  z.boolean(),
  StoredFileMetaSchema,
  z.null(),
]);

export const SubmitResponseSchema = z.object({
  answers: z.record(z.string(), StoredAnswerValueSchema),
});

export const ListFormsQuerySchema = z.object({
  userType: z.nativeEnum(SubmissionUserType).optional(),
});

export type FormFieldDto = z.infer<typeof FormFieldSchema>;
export type ListFormsQueryDtoType = z.infer<typeof ListFormsQuerySchema>;

export interface FormListItemDto {
  id: string;
  title: string;
  description: string | null;
  isPublished: boolean;
  submissionUserType: SubmissionUserType;
  createdAt: Date;
  updatedAt: Date;
  isSubmitted: boolean | null;
  submittedCount: number | null;
}

export interface FormResponseSubmitterDto {
  id: string | null;
  type: SubmissionUserType | null;
  name: string | null;
  phoneNumber: string | null;
}

export interface FormResponseListItemDto {
  id: string;
  formId: string;
  submitterId: string | null;
  submitterType: SubmissionUserType | null;
  submitter: FormResponseSubmitterDto;
  answers: Record<string, unknown>;
  submittedAt: Date;
}

export class CreateFormDto extends createZodDto(CreateFormSchema) {}
export interface CreateFormDto extends z.infer<typeof CreateFormSchema> {}

export class UpdateFormDto extends createZodDto(UpdateFormSchema) {}
export interface UpdateFormDto extends z.infer<typeof UpdateFormSchema> {}

export class SubmitResponseDto extends createZodDto(SubmitResponseSchema) {}
export interface SubmitResponseDto extends z.infer<
  typeof SubmitResponseSchema
> {}

export class ListFormsQueryDto extends createZodDto(ListFormsQuerySchema) {}
export interface ListFormsQueryDto extends ListFormsQueryDtoType {}
