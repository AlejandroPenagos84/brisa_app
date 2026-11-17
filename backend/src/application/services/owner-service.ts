import { NotFoundError } from '@/application/errors/application-error.js';
import type {
  OwnerEarnings,
  OwnerTransactions,
} from '@/application/models/owner-earnings.js';
import type { AdministratorTransactionRepository } from '@/application/ports/out/repositories/administrator-transaction-repository.js';
import type { OwnerRepository } from '@/application/ports/out/repositories/owner-repository.js';
import type { Owner } from '@/domain/owner.js';
import type { UUID } from '@/utils/types.js';

// Reads only. Creating, updating and deleting are use cases:
// CreateOwnerUseCase, UpdateOwnerUseCase and DeleteOwnerUseCase.
// Plain class: owner.module.ts builds it with useFactory, so the
// application layer does not depend on Nest
export class OwnerService {
  constructor(
    private readonly ownerRepository: OwnerRepository,
    private readonly transactionRepository: AdministratorTransactionRepository,
  ) {}

  async findByIds(ids: UUID[]): Promise<Owner[]> {
    return this.ownerRepository.findByIds(ids);
  }

  async findAll(): Promise<Owner[]> {
    return this.ownerRepository.findAll();
  }

  async findById(id: UUID): Promise<Owner | null> {
    return this.ownerRepository.findById(id);
  }

  // Total earned: computed from the transactions, not from the balance
  async getEarnings(id: UUID): Promise<OwnerEarnings> {
    const owner = await this.getOwnerOrThrow(id);
    const totalEarnings = await this.transactionRepository.sumNetByOwnerId(id);
    return { owner, totalEarnings };
  }

  // Detail, newest first
  async getTransactions(id: UUID): Promise<OwnerTransactions> {
    const owner = await this.getOwnerOrThrow(id);
    const transactions = await this.transactionRepository.findByOwnerId(id);
    return { owner, transactions };
  }

  private async getOwnerOrThrow(id: UUID): Promise<Owner> {
    const owner = await this.ownerRepository.findById(id);
    if (!owner) {
      throw new NotFoundError(`Owner with id ${id} not found`);
    }
    return owner;
  }
}
