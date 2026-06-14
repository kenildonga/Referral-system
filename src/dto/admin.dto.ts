import { z } from 'zod';
import { AdminRole } from '../common/constants/admin-role.enum';
import { createZodDto } from 'nestjs-zod';

export const passwordSchema = z
  .string()
  .min(8, 'validation.password.minLength')
  .max(255)
  .regex(/[a-zA-Z]/, 'validation.password.requireLetter')
  .regex(/[0-9]/, 'validation.password.requireNumber');

export const CreateAdminSchema = z.object({
  name: z.string().min(1, 'validation.name.required').max(255),
  email: z.string().email('validation.email.invalid').max(255),
  password: passwordSchema,
  role: z.nativeEnum(AdminRole).default(AdminRole.ADMIN),
});

export const LoginAdminSchema = z.object({
  email: z.string().email('validation.email.invalid'),
  password: z.string().min(1, 'validation.password.required'),
});

export const UpdateAdminSchema = z
  .object({
    name: z.string().min(1, 'validation.name.required').max(255).optional(),
    email: z.string().email('validation.email.invalid').max(255).optional(),
    role: z.nativeEnum(AdminRole).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'validation.atLeastOneField',
  });

export const ResetAdminPasswordSchema = z.object({
  newPassword: passwordSchema,
});

export const UpdateAdminStatusSchema = z.object({
  isActive: z.boolean(),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'validation.currentPassword.required'),
  newPassword: passwordSchema,
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('validation.email.invalid'),
});

export const ResetPasswordOtpSchema = z.object({
  email: z.string().email('validation.email.invalid'),
  otp: z.string().min(1, 'validation.otp.required'),
  newPassword: passwordSchema,
});

export class CreateAdminDto extends createZodDto(CreateAdminSchema) {}
export interface CreateAdminDto extends z.infer<typeof CreateAdminSchema> {}

export class LoginAdminDto extends createZodDto(LoginAdminSchema) {}
export interface LoginAdminDto extends z.infer<typeof LoginAdminSchema> {}

export class UpdateAdminDto extends createZodDto(UpdateAdminSchema) {}
export interface UpdateAdminDto extends z.infer<typeof UpdateAdminSchema> {}

export class ResetAdminPasswordDto extends createZodDto(
  ResetAdminPasswordSchema,
) {}
export interface ResetAdminPasswordDto extends z.infer<
  typeof ResetAdminPasswordSchema
> {}

export class UpdateAdminStatusDto extends createZodDto(
  UpdateAdminStatusSchema,
) {}
export interface UpdateAdminStatusDto extends z.infer<
  typeof UpdateAdminStatusSchema
> {}

export class ChangePasswordDto extends createZodDto(ChangePasswordSchema) {}
export interface ChangePasswordDto extends z.infer<
  typeof ChangePasswordSchema
> {}

export class ForgotPasswordDto extends createZodDto(ForgotPasswordSchema) {}
export interface ForgotPasswordDto extends z.infer<
  typeof ForgotPasswordSchema
> {}

export class ResetPasswordOtpDto extends createZodDto(ResetPasswordOtpSchema) {}
export interface ResetPasswordOtpDto extends z.infer<
  typeof ResetPasswordOtpSchema
> {}
