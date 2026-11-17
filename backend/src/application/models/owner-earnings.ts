import type { AdministratorTransaction } from '@/domain/administrator-transaction.js';
import type { Owner } from '@/domain/owner.js';

// Total: Σ net(PAYMENT) − Σ net(REFUND), computed from the transactions
export interface OwnerEarnings {
  owner: Owner;
  totalEarnings: number;
}

export interface OwnerTransactions {
  owner: Owner;
  transactions: AdministratorTransaction[];
}
