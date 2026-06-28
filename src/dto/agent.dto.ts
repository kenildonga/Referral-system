import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  changePasswordSchema,
  matchingBankAccountsRefinement,
  matchingBankAccountsRefinementConfig,
  bankDetailsWithConfirmFields,
  passwordSchema,
  phoneNumberSchema,
  sendPhoneOtpSchema,
} from './schemas/shared.schema';

export const CreateAgentSchema = z.object({
  firstName: z
    .string()
    .min(1, 'validation.firstName.required')
    .max(255, 'validation.firstName.maxLength'),
  middleName: z.string().max(255, 'validation.middleName.maxLength').optional(),
  lastName: z
    .string()
    .min(1, 'validation.lastName.required')
    .max(255, 'validation.lastName.maxLength'),
  phoneNumber: phoneNumberSchema.optional(),
  email: z.string().email('validation.email.invalid').max(255).optional(),
  state: z.string().min(1, 'validation.state.required').max(100),
  city: z.string().min(1, 'validation.city.required').max(100),
});

export const UpdateAgentSchema = z
  .object({
    firstName: z
      .string()
      .min(1, 'validation.firstName.required')
      .max(255, 'validation.firstName.maxLength')
      .optional(),
    middleName: z.string().max(255, 'validation.middleName.maxLength').optional(),
    lastName: z
      .string()
      .min(1, 'validation.lastName.required')
      .max(255, 'validation.lastName.maxLength')
      .optional(),
    phoneNumber: phoneNumberSchema.optional(),
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

export const ChangeAgentPasswordSchema = changePasswordSchema;

export const SignUpAgentSchema = z
  .object({
    firstName: z
      .string()
      .min(1, 'validation.firstName.required')
      .max(255, 'validation.firstName.maxLength'),
    middleName: z.string().max(255, 'validation.middleName.maxLength').optional(),
    lastName: z
      .string()
      .min(1, 'validation.lastName.required')
      .max(255, 'validation.lastName.maxLength'),
    phoneNumber: phoneNumberSchema,
    email: z
      .string()
      .min(1, 'validation.email.required')
      .email('validation.email.invalid')
      .max(255),
    state: z.string().min(1, 'validation.state.required').max(100),
    city: z.string().min(1, 'validation.city.required').max(100),
    password: passwordSchema,
    otp: z.string().length(4, 'validation.otp.invalid'),
    ...bankDetailsWithConfirmFields,
  })
  .refine(matchingBankAccountsRefinement, matchingBankAccountsRefinementConfig);

export const SendAgentRegistrationOtpSchema = sendPhoneOtpSchema;

export const UpdateAgentProfileSchema = z
  .object({
    firstName: z
      .string()
      .min(1, 'validation.firstName.required')
      .max(255, 'validation.firstName.maxLength')
      .optional(),
    middleName: z.string().max(255, 'validation.middleName.maxLength').optional(),
    lastName: z
      .string()
      .min(1, 'validation.lastName.required')
      .max(255, 'validation.lastName.maxLength')
      .optional(),
    phoneNumber: phoneNumberSchema.optional(),
    email: z.string().email('validation.email.invalid').max(255).optional(),
    state: z.string().min(1, 'validation.state.required').max(100).optional(),
    city: z.string().min(1, 'validation.city.required').max(100).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'validation.atLeastOneField',
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

export class SignUpAgentDto extends createZodDto(SignUpAgentSchema) {}
export interface SignUpAgentDto extends z.infer<typeof SignUpAgentSchema> {}

export class SendAgentRegistrationOtpDto extends createZodDto(
  SendAgentRegistrationOtpSchema,
) {}
export interface SendAgentRegistrationOtpDto extends z.infer<
  typeof SendAgentRegistrationOtpSchema
> {}

export class UpdateAgentProfileDto extends createZodDto(
  UpdateAgentProfileSchema,
) {}
export interface UpdateAgentProfileDto extends z.infer<
  typeof UpdateAgentProfileSchema
> {}