import type { UpdateAdministratorCommand } from '@/application/commands/update-administrator.command.js';
import { NotFoundError } from '@/application/errors/application-error.js';
import type { BankRepository } from '@/application/ports/out/repositories/bank-repository.js';
import type { UnitOfWork } from '@/application/ports/out/repositories/unit-of-work.js';
import type { Administrator } from '@/domain/administrator.js';

// Contact data and bank account of the single administrator. The balance
// only changes through rental payments.
export class UpdateAdministratorUseCase {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly bankRepository: BankRepository,
  ) {}

  async execute(command: UpdateAdministratorCommand): Promise<Administrator> {
    if (command.bankId !== undefined) {
      const bank = await this.bankRepository.findById(command.bankId);
      if (!bank) {
        throw new NotFoundError(`Bank with id ${command.bankId} not found`);
      }
    }

    return this.unitOfWork.run(async ({ administratorsRepository }) => {
      // Reservations and refunds use the same lock when updating the balance.
      const administrator =
        await administratorsRepository.getAdministratorForUpdate();

      if (command.name !== undefined) administrator.changeName(command.name);
      if (command.phone !== undefined) administrator.changePhone(command.phone);
      if (command.email !== undefined) administrator.changeEmail(command.email);
      administrator.changeBankAccount({
        bankId: command.bankId,
        accountNumber: command.accountNumber,
        accountType: command.accountType,
      });

      return administratorsRepository.update(administrator);
    });
  }
}
