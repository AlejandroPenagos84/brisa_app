import type { UpdateClientCommand } from '@/application/commands/update-client.command.js';
import {
  ConflictError,
  NotFoundError,
} from '@/application/errors/application-error.js';
import type { BankRepository } from '@/application/ports/out/repositories/bank-repository.js';
import type { CityRepository } from '@/application/ports/out/repositories/city-repository.js';
import type { ClientRepository } from '@/application/ports/out/repositories/client-repository.js';
import type { Client } from '@/domain/client.js';
import type { UUID } from '@/utils/types.js';

// Applies the changes first and checks uniqueness with the final values.
// Nothing is saved if a check fails.
export class UpdateClientUseCase {
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly cityRepository: CityRepository,
    private readonly bankRepository: BankRepository,
  ) {}

  async execute(id: UUID, command: UpdateClientCommand): Promise<Client> {
    const client = await this.clientRepository.findById(id);
    if (!client) {
      throw new NotFoundError(`Client with id ${id} not found`);
    }

    const [city, bank] = await Promise.all([
      command.cityId !== undefined
        ? this.cityRepository.findById(command.cityId)
        : Promise.resolve(undefined),
      command.bankId !== undefined
        ? this.bankRepository.findById(command.bankId)
        : Promise.resolve(undefined),
    ]);

    if (city === null) {
      throw new NotFoundError(`City with id ${command.cityId} not found`);
    }

    if (bank === null) {
      throw new NotFoundError(`Bank with id ${command.bankId} not found`);
    }

    if (command.name !== undefined) client.changeName(command.name);
    if (command.phone !== undefined) client.changePhone(command.phone);
    if (command.email !== undefined) client.changeEmail(command.email);
    if (command.cityId !== undefined) client.changeCityId(command.cityId);
    const accountChanged = client.changeBankAccount({
      bankId: command.bankId,
      accountNumber: command.accountNumber,
      accountType: command.accountType,
    });

    const [emailExists, accountExists] = await Promise.all([
      command.email !== undefined
        ? this.clientRepository.existsByEmail(client.getEmail(), id)
        : Promise.resolve(false),
      accountChanged
        ? this.clientRepository.existsByBankAccount(
            client.getBankId(),
            client.getAccountNumber(),
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

    return this.clientRepository.update(id, client);
  }
}
