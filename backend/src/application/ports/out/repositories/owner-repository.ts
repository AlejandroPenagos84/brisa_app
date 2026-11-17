import { Owner } from '@/domain/owner.js';
import type { UUID } from '@/utils/types.js';

export const OWNER_REPOSITORY = Symbol('OwnerRepository');

export interface OwnerRepository {
  findAll(): Promise<Owner[]>;
  findByIds(ids: UUID[]): Promise<Owner[]>;
  findById(id: UUID): Promise<Owner | null>;
  // Locks the row until the transaction ends. Only valid inside UnitOfWork.run
  findByIdForUpdate(id: UUID): Promise<Owner | null>;
  existsByEmail(email: string, excludeId?: UUID): Promise<boolean>;
  existsByBankAccount(
    bankId: UUID,
    accountNumber: string,
    excludeId?: UUID,
  ): Promise<boolean>;
  save(owner: Owner): Promise<Owner>;
  update(id: UUID, owner: Owner): Promise<Owner>;
  delete(id: UUID): Promise<boolean>;
}
