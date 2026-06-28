import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { passwordSchema } from './admin.dto';
import { UserStatus } from '../entities/enum';

const isoDateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'validation.date.invalidFormat');

function parseIsoDate(value: string): Date | null {
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }
  return parsed;
}

function isPastOrToday(value: string): boolean {
  const parsed = parseIsoDate(value);
  if (!parsed) return false;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return parsed <= today;
}

export const FillUserFormSchema = z
  .object({
    firstName: z.string().min(1, 'validation.firstName.required').max(255),
    middleName: z
      .string()
      .max(255, 'validation.middleName.maxLength')
      .optional(),
    lastName: z.string().min(1, 'validation.lastName.required').max(255),
    phoneNumber: z
      .string()
      .regex(/^\d{10}$/, 'validation.phoneNumber.invalid'),
    email: z.string().email('validation.email.invalid').max(255),
    password: z
      .string()
      .min(1, 'validation.password.required')
      .pipe(passwordSchema),
    referralCode: z
      .string()
      .trim()
      .max(20, 'validation.referralCode.maxLength')
      .optional(),
    dateOfBirth: isoDateString,
    addressLine1: z.string().min(1, 'validation.addressLine1.required').max(255),
    addressLine2: z.string().max(255).optional(),
    landmark: z.string().max(255).optional(),
    postalCode: z.string().regex(/^\d{6}$/, 'validation.postalCode.invalid'),
    isMarried: z.boolean(),
    marriageDate: isoDateString.optional().nullable(),
    accountHolderName: z
      .string()
      .min(1, 'validation.accountHolderName.required')
      .max(255),
    accountNumber: z
      .string()
      .regex(/^\d+$/, 'validation.accountNumber.invalid'),
    confirmAccountNumber: z
      .string()
      .regex(/^\d+$/, 'validation.accountNumber.invalid'),
    ifscCode: z
      .string()
      .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/i, 'validation.ifscCode.invalid'),
    otp: z.string().length(4, 'validation.otp.invalid'),
  })
  .refine((data) => data.confirmAccountNumber === data.accountNumber, {
    message: 'validation.accountNumber.mismatch',
    path: ['confirmAccountNumber'],
  })
  .refine((data) => isPastOrToday(data.dateOfBirth), {
    message: 'validation.dateOfBirth.invalid',
    path: ['dateOfBirth'],
  })
  .refine(
    (data) => {
      if (data.isMarried) {
        return !!data.marriageDate;
      }
      return !data.marriageDate;
    },
    {
      message: 'validation.marriageDate.required',
      path: ['marriageDate'],
    },
  )
  .refine(
    (data) => !data.marriageDate || isPastOrToday(data.marriageDate),
    {
      message: 'validation.marriageDate.invalid',
      path: ['marriageDate'],
    },
  );

export const SendRegistrationOtpSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/^\d{10}$/, 'validation.phoneNumber.invalid'),
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
    middleName: z.string().max(255, 'validation.middleName.maxLength').optional(),
    lastName: z.string().min(1, 'validation.lastName.required').max(255),
    phoneNumber: z.string().regex(/^\d{10}$/, 'validation.phoneNumber.invalid'),
    email: z.string().email('validation.email.invalid').max(255),
    password: passwordSchema,
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'validation.atLeastOneField',
  });

export const ListMyUsersQuerySchema = z.object({
  status: z.nativeEnum(UserStatus).optional(),
});

export const UpdateUserStatusSchema = z
  .object({
    status: z.enum([UserStatus.APPROVED, UserStatus.REJECTED]),
    note: z.string().min(1, 'validation.note.required').max(1000).optional(),
    chainId: z.string().uuid('validation.chainId.invalid').optional(),
  })
  .refine(
    (data) =>
      data.status !== UserStatus.REJECTED ||
      (data.note !== undefined && data.note.trim().length > 0),
    { message: 'user.noteRequiredForRejection', path: ['note'] },
  );

export class FillUserFormDto extends createZodDto(FillUserFormSchema) {}
export interface FillUserFormDto extends z.infer<typeof FillUserFormSchema> {}

export class SendRegistrationOtpDto extends createZodDto(
  SendRegistrationOtpSchema,
) {}
export interface SendRegistrationOtpDto extends z.infer<
  typeof SendRegistrationOtpSchema
> {}

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

export class ListMyUsersQueryDto extends createZodDto(ListMyUsersQuerySchema) {}
export interface ListMyUsersQueryDto extends z.infer<
  typeof ListMyUsersQuerySchema
> {}

export class UpdateUserStatusDto extends createZodDto(UpdateUserStatusSchema) {}
export interface UpdateUserStatusDto extends z.infer<
  typeof UpdateUserStatusSchema
> {}
