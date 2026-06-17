import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { passwordSchema } from './admin.dto';

export const CreateAgentSchema = z.object({
  name: z.string().min(1, 'validation.name.required').max(255),
  phone: z.string().max(50).optional(),
  email: z.string().email('validation.email.invalid').max(255).optional(),
  state: z.string().min(1, 'validation.state.required').max(100),
  city: z.string().min(1, 'validation.city.required').max(100),
});

export const UpdateAgentSchema = z
  .object({
    name: z.string().min(1, 'validation.name.required').max(255).optional(),
    phone: z.string().max(50).optional(),
    email: z.string().email('validation.email.invalid').max(255).optional(),
    state: z.string().min(1, 'validation.state.required').max(100).optional(),
    city: z.string().min(1, 'validation.city.required').max(100).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'validation.atLeastOneField',
  });

export const UpdateAgentStatusSchema = z.object({
  isActive: z.boolean(),
});

export const LoginAgentSchema = z.object({
  agentLoginId: z.string().min(1, 'validation.agentLoginId.required'),
  password: z.string().min(1, 'validation.password.required'),
});

export const ChangeAgentPasswordSchema = z.object({
  currentPassword: z.string().min(1, 'validation.currentPassword.required'),
  newPassword: passwordSchema,
});

export class CreateAgentDto extends createZodDto(CreateAgentSchema) {}
export interface CreateAgentDto extends z.infer<typeof CreateAgentSchema> {}

export class UpdateAgentDto extends createZodDto(UpdateAgentSchema) {}
export interface UpdateAgentDto extends z.infer<typeof UpdateAgentSchema> {}

export class UpdateAgentStatusDto extends createZodDto(
  UpdateAgentStatusSchema,
) {}
export interface UpdateAgentStatusDto extends z.infer<
  typeof UpdateAgentStatusSchema
> {}

export class LoginAgentDto extends createZodDto(LoginAgentSchema) {}
export interface LoginAgentDto extends z.infer<typeof LoginAgentSchema> {}

export class ChangeAgentPasswordDto extends createZodDto(
  ChangeAgentPasswordSchema,
) {}
export interface ChangeAgentPasswordDto extends z.infer<
  typeof ChangeAgentPasswordSchema
> {}
