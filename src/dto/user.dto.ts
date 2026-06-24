import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { passwordSchema } from './admin.dto';

export const FillUserFormSchema = z.object({
  firstName: z.string().min(1, 'validation.firstName.required').max(255),
  lastName: z.string().min(1, 'validation.lastName.required').max(255),
  phoneNumber: z.string().regex(/^\d{10}$/, 'validation.phoneNumber.invalid'),
  email: z.string().email('validation.email.invalid').max(255),
  password: z
    .string()
    .min(1, 'validation.password.required')
    .pipe(passwordSchema),
});

export const UpdateUserAgentSchema = z.object({
  agentId: z.string().uuid('validation.agentId.invalid'),
  stateId: z.coerce.number().int().positive('validation.stateId.invalid'),
  cityId: z.coerce.number().int().positive('validation.cityId.invalid'),
});

export const ListAgentsQuerySchema = z.object({
  stateId: z.coerce.number().int().positive('validation.stateId.invalid'),
  cityId: z.coerce.number().int().positive('validation.cityId.invalid'),
});

export const LoginUserSchema = z.object({
  phoneNumber: z.string().regex(/^\d{10}$/, 'validation.phoneNumber.invalid'),
  password: z.string().min(1, 'validation.password.required'),
});

export const UpdateUserSchema = z
  .object({
    firstName: z.string().min(1, 'validation.firstName.required').max(255),
    lastName: z.string().min(1, 'validation.lastName.required').max(255),
    phoneNumber: z.string().regex(/^\d{10}$/, 'validation.phoneNumber.invalid'),
    email: z.string().email('validation.email.invalid').max(255),
    password: passwordSchema,
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'validation.atLeastOneField',
  });

export class FillUserFormDto extends createZodDto(FillUserFormSchema) {}
export interface FillUserFormDto extends z.infer<typeof FillUserFormSchema> {}

export class UpdateUserAgentDto extends createZodDto(UpdateUserAgentSchema) {}
export interface UpdateUserAgentDto extends z.infer<
  typeof UpdateUserAgentSchema
> {}

export class ListAgentsQueryDto extends createZodDto(ListAgentsQuerySchema) {}
export interface ListAgentsQueryDto extends z.infer<
  typeof ListAgentsQuerySchema
> {}

export class LoginUserDto extends createZodDto(LoginUserSchema) {}
export interface LoginUserDto extends z.infer<typeof LoginUserSchema> {}

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
export interface UpdateUserDto extends z.infer<typeof UpdateUserSchema> {}
