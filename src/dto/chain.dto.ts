import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateChainSchema = z.object({
  name: z.string().min(1, 'validation.name.required').max(255),
});

export const UpdateChainSchema = z
  .object({
    name: z.string().min(1, 'validation.name.required').max(255).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'validation.atLeastOneField',
  });

export class CreateChainDto extends createZodDto(CreateChainSchema) {}
export class UpdateChainDto extends createZodDto(UpdateChainSchema) {}
