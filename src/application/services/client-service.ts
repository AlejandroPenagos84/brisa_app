import { randomUUID } from 'node:crypto';
import {
  ConflictError,
  NotFoundError,
} from '@/application/errors/application-error.js';
import { Client } from '@/domain/client.js';
import { UUID } from '@/utils/types.js';
import type { CreateClientCommand } from '../commands/create-client.command.js';
import type { UpdateClientCommand } from '../commands/update-client.command.js';
import type { ClientDetails } from '../models/client-details.js';
import type { UnitOfWork } from '../ports/out/repositories/unit-of-work.js';
import type { BankRepository } from '../ports/out/repositories/bank-repository.js';
import type { CityRepository } from '../ports/out/repositories/city-repository.js';
import type { ClientRepository } from '../ports/out/repositories/client-repository.js';
import type { CountryRepository } from '../ports/out/repositories/country-repository.js';

interface NormalizedClientInput {
  email: string;
  accountNumber: string;
}

interface ClientUpdateValues {
  email?: string;
  bankId: UUID;
  accountNumber: string;
  bankAccountChanged: boolean;
}

// Plain class: client.module.ts builds it with useFactory, so the
// application layer does not depend on Nest
export class ClientService {
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly cityRepository: CityRepository,
    private readonly bankRepository: BankRepository,
    private readonly countryRepository: CountryRepository,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async findByIds(ids: UUID[]): Promise<Client[]> {
    return this.clientRepository.findByIds(ids);
  }

  async findAll(): Promise<ClientDetails[]> {
    const clients = await this.clientRepository.findAll();
    return this.loadDetails(clients);
  }

  async findById(id: UUID): Promise<ClientDetails | null> {
    const client = await this.clientRepository.findById(id);
    if (!client) return null;

    const [details] = await this.loadDetails([client]);
    return details;
  }

  private async loadDetails(clients: Client[]): Promise<ClientDetails[]> {
    if (clients.length === 0) return [];

    const bankIds = [...new Set(clients.map((client) => client.getBankId()))];
    const banks = await this.bankRepository.findByIds(bankIds);

    const countryIds = [...new Set(banks.map((bank) => bank.getCountryId()))];
    const countries = await this.countryRepository.findByIds(countryIds);

    const banksById = new Map(banks.map((bank) => [bank.getId(), bank]));
    const countriesById = new Map(
      countries.map((country) => [country.getId(), country]),
    );

    return clients.map((client) => {
      const bank = banksById.get(client.getBankId());
      if (!bank) {
        throw new Error(`Missing bank for client ${client.getId()}`);
      }

      const country = countriesById.get(bank.getCountryId());
      if (!country) {
        throw new Error(`Missing country for bank ${bank.getId()}`);
      }

      return { client, bank, country };
    });
  }

  async create(command: CreateClientCommand): Promise<Client> {
    const { email, accountNumber } = await this.validateCreate(command);

    const client = new Client(
      randomUUID(),
      command.name,
      command.phone,
      email,
      command.cityId,
      command.bankId,
      accountNumber,
      command.accountType,
      command.balance,
    );

    return this.clientRepository.save(client);
  }

  private async validateCreate(
    command: CreateClientCommand,
  ): Promise<NormalizedClientInput> {
    const email = command.email.trim().toLowerCase();
    const accountNumber = command.accountNumber.trim();
    const [city, bank, emailExists, accountExists] = await Promise.all([
      this.cityRepository.findById(command.cityId),
      this.bankRepository.findById(command.bankId),
      this.clientRepository.existsByEmail(email),
      this.clientRepository.existsByBankAccount(
        command.bankId,
        accountNumber,
      ),
    ]);

    if (!city) {
      throw new NotFoundError(
        `City with id ${command.cityId} not found`,
      );
    }

    if (!bank) {
      throw new NotFoundError(
        `Bank with id ${command.bankId} not found`,
      );
    }

    if (emailExists) {
      throw new ConflictError('The email is already registered');
    }

    if (accountExists) {
      throw new ConflictError(
        'The bank account is already registered',
      );
    }

    return { email, accountNumber };
  }

  async update(id: UUID, command: UpdateClientCommand): Promise<Client> {
    const client = await this.getClientOrThrow(id);

    await this.validateUpdateRelations(command);
    const values = await this.validateUpdateUniqueness(id, client, command);
    this.applyUpdateChanges(client, command, values);

    return this.clientRepository.update(id, client);
  }

  private async validateUpdateRelations(
    command: UpdateClientCommand,
  ): Promise<void> {
    if (command.cityId !== undefined) {
      const city = await this.cityRepository.findById(command.cityId);
      if (!city) {
        throw new NotFoundError(
          `City with id ${command.cityId} not found`,
        );
      }
    }

    if (command.bankId !== undefined) {
      const bank = await this.bankRepository.findById(command.bankId);
      if (!bank) {
        throw new NotFoundError(
          `Bank with id ${command.bankId} not found`,
        );
      }
    }
  }

  private async validateUpdateUniqueness(
    id: UUID,
    client: Client,
    command: UpdateClientCommand,
  ): Promise<ClientUpdateValues> {
    const email =
      command.email !== undefined
        ? command.email.trim().toLowerCase()
        : undefined;
    const bankId = command.bankId ?? client.getBankId();
    const accountNumber =
      command.accountNumber !== undefined
        ? command.accountNumber.trim()
        : client.getAccountNumber();
    const bankAccountChanged =
      command.bankId !== undefined ||
      command.accountNumber !== undefined ||
      command.accountType !== undefined;

    const [emailExists, accountExists] = await Promise.all([
      email !== undefined
        ? this.clientRepository.existsByEmail(email, id)
        : Promise.resolve(false),
      command.bankId !== undefined || command.accountNumber !== undefined
        ? this.clientRepository.existsByBankAccount(
            bankId,
            accountNumber,
            id,
          )
        : Promise.resolve(false),
    ]);

    if (emailExists) {
      throw new ConflictError('The email is already registered');
    }

    if (accountExists) {
      throw new ConflictError(
        'The bank account is already registered',
      );
    }

    return { email, bankId, accountNumber, bankAccountChanged };
  }

  private applyUpdateChanges(
    client: Client,
    command: UpdateClientCommand,
    values: ClientUpdateValues,
  ): void {
    if (command.name !== undefined) {
      client.changeName(command.name);
    }
    if (command.phone !== undefined) {
      client.changePhone(command.phone);
    }
    if (values.email !== undefined) {
      client.changeEmail(values.email);
    }
    if (command.cityId !== undefined) {
      client.changeCityId(command.cityId);
    }

    if (values.bankAccountChanged) {
      client.changeBankAccount(
        values.bankId,
        values.accountNumber,
        command.accountType ?? client.getAccountType(),
      );
    }
  }

  async deposit(id: UUID, amount: number): Promise<Client> {
    return this.unitOfWork.run(async ({ clientsRepository }) => {
      const client = await clientsRepository.findByIdForUpdate(id);
      if (!client) throw new NotFoundError(`Client with id ${id} not found`);
      client.deposit(amount);
      return clientsRepository.update(id, client);
    });
  }

  async withdraw(id: UUID, amount: number): Promise<Client> {
    return this.unitOfWork.run(async ({ clientsRepository }) => {
      const client = await clientsRepository.findByIdForUpdate(id);
      if (!client) throw new NotFoundError(`Client with id ${id} not found`);
      client.discount(amount);
      return clientsRepository.update(id, client);
    });
  }

  async delete(id: UUID): Promise<boolean> {
    if (await this.clientRepository.hasActiveRentals(id)) {
      throw new ConflictError(
        `Client with id ${id} has active or upcoming rentals`,
      );
    }

    return this.clientRepository.deleteWithFinishedRentals(id);
  }

  private async getClientOrThrow(id: UUID): Promise<Client> {
    const client = await this.clientRepository.findById(id);
    if (!client) {
      throw new NotFoundError(`Client with id ${id} not found`);
    }
    return client;
  }

}
