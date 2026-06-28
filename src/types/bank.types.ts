import type { z } from 'zod';
import { bankDetailsInputSchema } from '../dto/schemas/shared.schema';

export type CreateBankDetailsInput = z.infer<typeof bankDetailsInputSchema>;