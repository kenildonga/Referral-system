import { Admin } from '../entities/admins.entity';
import { Agent } from '../entities/agents.entity';
import { User } from '../entities/users.entity';

export type SafeAdmin = Omit<Admin, 'password' | 'tokenVersion'>;

export type SafeAgent = Omit<Agent, 'password' | 'tokenVersion' | 'createdBy'>;

export type SafeUser = Omit<
  User,
  'agent' | 'password' | 'tokenVersion' | 'referredBy'
>;

export type SafeUserResponse = SafeUser & { referredByName: string | null };

export type UserWithFormStats = SafeUserResponse & {
  filledFormsCount: number;
  totalFormsCount: number;
};