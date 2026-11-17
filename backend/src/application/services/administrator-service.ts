import type { AdministratorRepository } from '@/application/ports/out/repositories/administrator-repository.js';
import type { AdministratorTransactionRepository } from '@/application/ports/out/repositories/administrator-transaction-repository.js';
import type { AdministratorTransaction } from '@/domain/administrator-transaction.js';
import type { Administrator } from '@/domain/administrator.js';

// Reads only. Updating is UpdateAdministratorUseCase.
// Plain class: administrator.module.ts builds it with useFactory
export class AdministratorService {
  constructor(
    private readonly administratorRepository: AdministratorRepository,
    private readonly transactionRepository: AdministratorTransactionRepository,
  ) {}

  async get(): Promise<Administrator> {
    return this.administratorRepository.getAdministrator();
  }

  // Every transaction, newest first
  async getTransactions(): Promise<AdministratorTransaction[]> {
    return this.transactionRepository.findAll();
  }
}
