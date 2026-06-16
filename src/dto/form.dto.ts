import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

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
});

export const UpdateFormSchema = z
  .object({
    title: z.string().min(1, 'validation.title.required').max(255).optional(),
    description: z.string().max(2000).optional(),
    fields: z.array(FormFieldSchema).optional(),
    isPublished: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'validation.atLeastOneField',
  });

const StoredFileMetaSchema = z.object({
  kind: z.literal('file'),
  key: z.string().min(1, 'validation.fileKey.required'),
  url: z.string().url('validation.fileUrl.invalid'),
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

export type FormFieldDto = z.infer<typeof FormFieldSchema>;

export class CreateFormDto extends createZodDto(CreateFormSchema) {}
export interface CreateFormDto extends z.infer<typeof CreateFormSchema> {}

export class UpdateFormDto extends createZodDto(UpdateFormSchema) {}
export interface UpdateFormDto extends z.infer<typeof UpdateFormSchema> {}

export class SubmitResponseDto extends createZodDto(SubmitResponseSchema) {}
export interface SubmitResponseDto extends z.infer<typeof SubmitResponseSchema> {}
