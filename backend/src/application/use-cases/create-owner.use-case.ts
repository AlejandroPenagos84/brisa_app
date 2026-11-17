import { randomUUID } from 'node:crypto';
import type { CreateOwnerCommand } from '@/application/commands/create-owner.command.js';
import {
  ConflictError,
  NotFoundError,
} from '@/application/errors/application-error.js';
import type { BankRepository } from '@/application/ports/out/repositories/bank-repository.js';
import type { OwnerRepository } from '@/application/ports/out/repositories/owner-repository.js';
import type { Bank } from '@/domain/bank.js';
import { Owner } from '@/domain/owner.js';

export interface CreatedOwner {
  owner: Owner;
  bank: Bank;
}

export class CreateOwnerUseCase {
  constructor(
    private readonly ownerRepository: OwnerRepository,
    private readonly bankRepository: BankRepository,
  ) {}

  async execute(command: CreateOwnerCommand): Promise<CreatedOwner> {
    const bank = await this.bankRepository.findById(command.bankId);
    if (!bank) {
      throw new NotFoundError(`Bank with id ${command.bankId} not found`);
    }

    // The domain validates and normalizes (email in lower case, trimmed
    // account); uniqueness is checked with the normalized values
    const owner = new Owner(
      randomUUID(),
      command.name,
      command.phone,
      command.email,
      command.bankId,
      command.accountNumber,
      command.accountType,
    );

    const [emailExists, accountExists] = await Promise.all([
      this.ownerRepository.existsByEmail(owner.getEmail()),
      this.ownerRepository.existsByBankAccount(
        owner.getBankId(),
        owner.getAccountNumber(),
      ),
    ]);

    if (emailExists) {
      throw new ConflictError('The email is already registered');
    }

    if (accountExists) {
      throw new ConflictError('The bank account is already registered');
    }

    const saved = await this.ownerRepository.save(owner);
    return { owner: saved, bank };
  }
}
