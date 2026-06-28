import { Chain } from '../entities/chains.entity';

export interface UserApprovalInfo {
  requiresChainSelection: boolean;
  suggestedChainId: string | null;
  chains: Chain[];
}

export interface ChainReferralUserItem {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  position: number;
  assignType: string;
  referredByName: string | null;
}

export interface AgentChainReferralGroup {
  id: string;
  name: string;
  users: ChainReferralUserItem[];
}

export interface AgentChainReferralsResponse {
  chains: AgentChainReferralGroup[];
}