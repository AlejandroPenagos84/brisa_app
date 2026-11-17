import type { UpdateOwnerCommand } from '@/application/commands/update-owner.command.js';
import {
  ConflictError,
  NotFoundError,
} from '@/application/errors/application-error.js';
import type { BankRepository } from '@/application/ports/out/repositories/bank-repository.js';
import type { OwnerRepository } from '@/application/ports/out/repositories/owner-repository.js';
import type { Owner } from '@/domain/owner.js';
import type { UUID } from '@/utils/types.js';

// Applies the changes first and checks uniqueness with the final values.
// Nothing is saved if a check fails.
export class UpdateOwnerUseCase {
  constructor(
    private readonly ownerRepository: OwnerRepository,
    private readonly bankRepository: BankRepository,
  ) {}

  async execute(id: UUID, command: UpdateOwnerCommand): Promise<Owner> {
    const owner = await this.ownerRepository.findById(id);
    if (!owner) {
      throw new NotFoundError(`Owner with id ${id} not found`);
    }

    if (command.bankId !== undefined) {
      const bank = await this.bankRepository.findById(command.bankId);
      if (!bank) {
        throw new NotFoundError(`Bank with id ${command.bankId} not found`);
      }
    }

    if (command.name !== undefined) owner.changeName(command.name);
    if (command.phone !== undefined) owner.changePhone(command.phone);
    if (command.email !== undefined) owner.changeEmail(command.email);
    const accountChanged = owner.changeBankAccount({
      bankId: command.bankId,
      accountNumber: command.accountNumber,
      accountType: command.accountType,
    });

    const [emailExists, accountExists] = await Promise.all([
      command.email !== undefined
        ? this.ownerRepository.existsByEmail(owner.getEmail(), id)
        : Promise.resolve(false),
      accountChanged
        ? this.ownerRepository.existsByBankAccount(
            owner.getBankId(),
            owner.getAccountNumber(),
            id,
          )
        : Promise.resolve(false),
    ]);

    if (emailExists) {
      throw new ConflictError('The email is already registered');
    }

    if (accountExists) {
      throw new ConflictError('The bank account is already registered');
    }

    return this.ownerRepository.update(id, owner);
  }
}
