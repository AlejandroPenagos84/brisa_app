import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Client } from '@/domain/client.js';
import { UUID } from '@/utils/types.js';
import type { CreateClientCommand } from '../commands/create-client.command.js';
import type { UpdateClientCommand } from '../commands/update-client.command.js';
import type { ClientDetails } from '../models/client-details.js';
import {
  BANK_REPOSITORY,
  type BankRepository,
} from '../ports/out/repositories/bank-repository.js';
import {
  CITY_REPOSITORY,
  type CityRepository,
} from '../ports/out/repositories/city-repository.js';
import {
  CLIENT_REPOSITORY,
  type ClientRepository,
} from '../ports/out/repositories/client-repository.js';
import {
  COUNTRY_REPOSITORY,
  type CountryRepository,
} from '../ports/out/repositories/country-repository.js';

@Injectable()
export class ClientService {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
    @Inject(CITY_REPOSITORY)
    private readonly cityRepository: CityRepository,
    @Inject(BANK_REPOSITORY)
    private readonly bankRepository: BankRepository,
    @Inject(COUNTRY_REPOSITORY)
    private readonly countryRepository: CountryRepository,
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
    const [city, bank] = await Promise.all([
      this.cityRepository.findById(command.cityId),
      this.bankRepository.findById(command.bankId),
    ]);

    if (!city) {
      throw new NotFoundException(
        `City with id ${command.cityId} not found`,
      );
    }

    if (!bank) {
      throw new NotFoundException(
        `Bank with id ${command.bankId} not found`,
      );
    }

    let client: Client;

    try {
      client = new Client(
        randomUUID(),
        command.name,
        command.phone,
        command.email,
        command.cityId,
        command.bankId,
        command.accountNumber,
        command.accountType,
        command.balance,
      );
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      throw new BadRequestException(error.message);
    }

    return this.clientRepository.save(client);
  }

  async update(id: UUID, command: UpdateClientCommand): Promise<Client> {
    const client = await this.getClientOrThrow(id);

    if (command.cityId !== undefined) {
      const city = await this.cityRepository.findById(command.cityId);
      if (!city) {
        throw new NotFoundException(
          `City with id ${command.cityId} not found`,
        );
      }
    }

    if (command.bankId !== undefined) {
      const bank = await this.bankRepository.findById(command.bankId);
      if (!bank) {
        throw new NotFoundException(
          `Bank with id ${command.bankId} not found`,
        );
      }
    }

    try {
      if (command.name !== undefined) {
        client.changeName(command.name);
      }
      if (command.phone !== undefined) {
        client.changePhone(command.phone);
      }
      if (command.email !== undefined) {
        client.changeEmail(command.email);
      }
      if (command.cityId !== undefined) {
        client.changeCityId(command.cityId);
      }

      const bankAccountChanged =
        command.bankId !== undefined ||
        command.accountNumber !== undefined ||
        command.accountType !== undefined;

      if (bankAccountChanged) {
        client.changeBankAccount(
          command.bankId ?? client.getBankId(),
          command.accountNumber ?? client.getAccountNumber(),
          command.accountType ?? client.getAccountType(),
        );
      }
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      throw new BadRequestException(error.message);
    }

    return this.clientRepository.update(id, client);
  }

  async deposit(id: UUID, amount: number): Promise<Client> {
    const client = await this.getClientOrThrow(id);

    try {
      client.deposit(amount);
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      throw new BadRequestException(error.message);
    }

    return this.clientRepository.update(id, client);
  }

  async withdraw(id: UUID, amount: number): Promise<Client> {
    const client = await this.getClientOrThrow(id);

    try {
      client.discount(amount);
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      throw new BadRequestException(error.message);
    }

    return this.clientRepository.update(id, client);
  }

  async delete(id: UUID): Promise<boolean> {
    return this.clientRepository.delete(id);
  }

  private async getClientOrThrow(id: UUID): Promise<Client> {
    const client = await this.clientRepository.findById(id);
    if (!client) {
      throw new NotFoundException(`Client with id ${id} not found`);
    }
    return client;
  }
}
