import { randomUUID } from 'node:crypto';
import {
  ConflictError,
  NotFoundError,
} from '@/application/errors/application-error.js';
import { Client } from '@/domain/client.js';
import type { UUID } from '@/utils/types.js';
import type { CreateClientCommand } from '@/application/commands/create-client.command.js';
import type { ClientDetails } from '@/application/models/client-details.js';
import type { Clock } from '@/application/ports/out/clock.js';
import type { UnitOfWork } from '@/application/ports/out/repositories/unit-of-work.js';
import type { BankRepository } from '@/application/ports/out/repositories/bank-repository.js';
import type { CityRepository } from '@/application/ports/out/repositories/city-repository.js';
import type { ClientRepository } from '@/application/ports/out/repositories/client-repository.js';
import type { CountryRepository } from '@/application/ports/out/repositories/country-repository.js';

// Updating is UpdateClientUseCase.
// Plain class: client.module.ts builds it with useFactory, so the
// application layer does not depend on Nest
export class ClientService {
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly cityRepository: CityRepository,
    private readonly bankRepository: BankRepository,
    private readonly countryRepository: CountryRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
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
    // The domain validates and normalizes (email in lower case, trimmed
    // account); uniqueness is checked with the normalized values
    const client = new Client(
      randomUUID(),
      command.name,
      command.phone,
      command.email,
      command.cityId,
      command.bankId,
      command.accountNumber,
      command.accountType,
    );

    const [city, bank, emailExists, accountExists] = await Promise.all([
      this.cityRepository.findById(client.getCityId()),
      this.bankRepository.findById(client.getBankId()),
      this.clientRepository.existsByEmail(client.getEmail()),
      this.clientRepository.existsByBankAccount(
        client.getBankId(),
        client.getAccountNumber(),
      ),
    ]);

    if (!city) {
      throw new NotFoundError(`City with id ${command.cityId} not found`);
    }

    if (!bank) {
      throw new NotFoundError(`Bank with id ${command.bankId} not found`);
    }

    if (emailExists) {
      throw new ConflictError('The email is already registered');
    }

    if (accountExists) {
      throw new ConflictError('The bank account is already registered');
    }

    return this.clientRepository.save(client);
  }

  // The domain rejects it if the client has current rentals. The client is
  // locked, so no rental can be booked while it is deleted.
  async delete(id: UUID): Promise<void> {
    const today = this.clock.today();

    await this.unitOfWork.run(
      async ({ clientsRepository, rentalsRepository }) => {
        const client = await clientsRepository.findByIdForUpdate(id);
        if (!client) throw new NotFoundError(`Client with id ${id} not found`);

        const currentRentals = await rentalsRepository.findCurrentByClientId(
          id,
          today,
        );
        client.assertCanBeDeleted(currentRentals);

        const deleted = await clientsRepository.deleteWithFinishedRentals(
          id,
          today,
        );
        if (!deleted) throw new NotFoundError(`Client with id ${id} not found`);
      },
    );
  }
}
