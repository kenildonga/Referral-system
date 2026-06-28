import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8, 'validation.password.minLength')
  .max(255, 'validation.password.maxLength')
  .regex(/[a-zA-Z]/, 'validation.password.requireLetter')
  .regex(/[0-9]/, 'validation.password.requireNumber');

export const phoneNumberSchema = z
  .string()
  .regex(/^\d{10}$/, 'validation.phoneNumber.invalid');

export const isoDateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'validation.date.invalidFormat');

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'validation.currentPassword.required'),
  newPassword: passwordSchema,
});

export const sendPhoneOtpSchema = z.object({
  phoneNumber: phoneNumberSchema,
});

const accountNumberSchema = z
  .string()
  .regex(/^\d+$/, 'validation.accountNumber.invalid');

export const bankDetailsInputSchema = z.object({
  accountHolderName: z
    .string()
    .min(1, 'validation.accountHolderName.required')
    .max(255),
  accountNumber: accountNumberSchema,
  ifscCode: z
    .string()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/i, 'validation.ifscCode.invalid'),
});

export const bankDetailsWithConfirmFields = {
  accountHolderName: bankDetailsInputSchema.shape.accountHolderName,
  accountNumber: accountNumberSchema,
  confirmAccountNumber: accountNumberSchema,
  ifscCode: bankDetailsInputSchema.shape.ifscCode,
};

export function matchingBankAccountsRefinement(data: {
  accountNumber: string;
  confirmAccountNumber: string;
}): boolean {
  return data.confirmAccountNumber === data.accountNumber;
}

export const matchingBankAccountsRefinementConfig = {
  message: 'validation.accountNumber.mismatch',
  path: ['confirmAccountNumber'],
};