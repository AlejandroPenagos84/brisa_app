import { AdministratorTransaction } from '@/domain/administrator-transaction.js';
import { UUID } from '@/utils/types.js';

export const ADMINISTRATOR_TRANSACTION_REPOSITORY = Symbol(
  'AdministratorTransactionRepository',
);

// Transactions are never updated or deleted, only added
export interface AdministratorTransactionRepository {
  // Newest first
  findAll(): Promise<AdministratorTransaction[]>;
  // Newest first
  findByOwnerId(ownerId: UUID): Promise<AdministratorTransaction[]>;
  // Σ net(PAYMENT) − Σ net(REFUND) of the owner. 0 without transactions
  sumNetByOwnerId(ownerId: UUID): Promise<number>;
  save(transaction: AdministratorTransaction): Promise<AdministratorTransaction>;
}
