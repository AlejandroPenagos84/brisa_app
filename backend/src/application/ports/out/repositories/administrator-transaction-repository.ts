import { AdministratorTransaction } from '@/domain/administrator-transaction.js';
import type { UUID } from '@/utils/types.js';

export const ADMINISTRATOR_TRANSACTION_REPOSITORY = Symbol(
  'AdministratorTransactionRepository',
);

// Transactions are never updated. They are only deleted together with
// their owner (DeleteOwnerUseCase); the administrator balance is kept.
export interface AdministratorTransactionRepository {
  // Newest first
  findAll(): Promise<AdministratorTransaction[]>;
  // Newest first
  findByOwnerId(ownerId: UUID): Promise<AdministratorTransaction[]>;
  // Σ net(PAYMENT) − Σ net(REFUND) of the owner. 0 without transactions
  sumNetByOwnerId(ownerId: UUID): Promise<number>;
  save(
    transaction: AdministratorTransaction,
  ): Promise<AdministratorTransaction>;
  deleteByOwnerId(ownerId: UUID): Promise<void>;
}
