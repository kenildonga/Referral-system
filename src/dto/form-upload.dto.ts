import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const PresignUploadSchema = z.object({
  fieldId: z.string().min(1, 'validation.fieldId.required'),
  fileName: z.string().min(1, 'validation.fileName.required').max(255),
  contentType: z.string().min(1, 'validation.contentType.required'),
  size: z.number().int().positive('validation.fileSize.required'),
});

export class PresignUploadDto extends createZodDto(PresignUploadSchema) {}
export interface PresignUploadDto extends z.infer<typeof PresignUploadSchema> {}
