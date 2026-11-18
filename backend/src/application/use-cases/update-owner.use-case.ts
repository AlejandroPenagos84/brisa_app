import type { UpdateOwnerCommand } from '@/application/commands/update-owner.command.js';
import {
  ConflictError,
  NotFoundError,
} from '@/application/errors/application-error.js';
import type { BankRepository } from '@/application/ports/out/repositories/bank-repository.js';
import type { UnitOfWork } from '@/application/ports/out/repositories/unit-of-work.js';
import type { Owner } from '@/domain/owner.js';
import type { UUID } from '@/utils/types.js';

// Applies the changes first and checks uniqueness with the final values.
// Nothing is saved if a check fails.
export class UpdateOwnerUseCase {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly bankRepository: BankRepository,
  ) {}

  async execute(id: UUID, command: UpdateOwnerCommand): Promise<Owner> {
    if (command.bankId !== undefined) {
      const bank = await this.bankRepository.findById(command.bankId);
      if (!bank) {
        throw new NotFoundError(`Bank with id ${command.bankId} not found`);
      }
    }

    return this.unitOfWork.run(async ({ ownersRepository }) => {
      // Reservations and refunds use the same lock when updating the balance.
      const owner = await ownersRepository.findByIdForUpdate(id);
      if (!owner) {
        throw new NotFoundError(`Owner with id ${id} not found`);
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
          ? ownersRepository.existsByEmail(owner.getEmail(), id)
          : Promise.resolve(false),
        accountChanged
          ? ownersRepository.existsByBankAccount(
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

      return ownersRepository.update(id, owner);
    });
  }
}
