import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { vi } from 'vitest';
import { BANK_REPOSITORY } from '@/application/ports/out/repositories/bank-repository.js';
import { CITY_REPOSITORY } from '@/application/ports/out/repositories/city-repository.js';
import { CLIENT_REPOSITORY } from '@/application/ports/out/repositories/client-repository.js';
import { COUNTRY_REPOSITORY } from '@/application/ports/out/repositories/country-repository.js';
import { ClientService } from '@/application/services/client-service.js';
import { Client } from '@/domain/client.js';

const makeClient = (balance = 500) =>
  new Client(
    'client-1',
    'Ana',
    '3001234567',
    'ana@example.com',
    'city-1',
    'bank-1',
    '12345',
    'Ahorros',
    balance,
  );

const city = { getId: () => 'city-1' };
const bank = { getId: () => 'bank-1' };
const country = { getId: () => 'country-1' };

describe('ClientService', () => {
  const clients = {
    findAll: vi.fn(),
    findByIds: vi.fn(),
    findById: vi.fn(),
    existsByEmail: vi.fn(),
    existsByBankAccount: vi.fn(),
    hasActiveRentals: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    deleteWithFinishedRentals: vi.fn(),
  };
  const cities = {
    findById: vi.fn(),
  };
  const banks = {
    findById: vi.fn(),
  };
  const countries = {
    findByIds: vi.fn(),
  };

  let service: ClientService;

  beforeEach(async () => {
    vi.resetAllMocks();

    clients.findById.mockResolvedValue(makeClient());
    clients.existsByEmail.mockResolvedValue(false);
    clients.existsByBankAccount.mockResolvedValue(false);
    clients.hasActiveRentals.mockResolvedValue(false);
    clients.save.mockImplementation((value: Client) => Promise.resolve(value));
    clients.update.mockImplementation((_id: string, value: Client) =>
      Promise.resolve(value),
    );
    clients.deleteWithFinishedRentals.mockResolvedValue(true);
    cities.findById.mockResolvedValue(city);
    banks.findById.mockResolvedValue(bank);
    countries.findByIds.mockResolvedValue([country]);

    const module = await Test.createTestingModule({
      providers: [
        ClientService,
        { provide: CLIENT_REPOSITORY, useValue: clients },
        { provide: CITY_REPOSITORY, useValue: cities },
        { provide: BANK_REPOSITORY, useValue: banks },
        { provide: COUNTRY_REPOSITORY, useValue: countries },
      ],
    }).compile();
    service = module.get(ClientService);
  });

  describe('create', () => {
    const command = {
      name: 'Ana',
      phone: '3001234567',
      email: 'ana@example.com',
      cityId: 'city-1',
      bankId: 'bank-1',
      accountNumber: '12345',
      accountType: 'Ahorros',
      balance: 500,
    };

    it('rejects an email already registered', async () => {
      clients.existsByEmail.mockResolvedValue(true);

      await expect(service.create(command)).rejects.toThrow(
        ConflictException,
      );
      expect(clients.save).not.toHaveBeenCalled();
    });

    it('rejects a bank account already registered', async () => {
      clients.existsByBankAccount.mockResolvedValue(true);

      await expect(service.create(command)).rejects.toThrow(
        ConflictException,
      );
      expect(clients.save).not.toHaveBeenCalled();
    });

  });

  describe('update', () => {
    it('rejects an email already used by another client', async () => {
      clients.existsByEmail.mockResolvedValue(true);

      await expect(
        service.update('client-1', { email: 'other@example.com' }),
      ).rejects.toThrow(ConflictException);
      expect(clients.existsByEmail).toHaveBeenCalledWith(
        'other@example.com',
        'client-1',
      );
      expect(clients.update).not.toHaveBeenCalled();
    });

    it('rejects a bank account already used by another client', async () => {
      clients.existsByBankAccount.mockResolvedValue(true);

      await expect(
        service.update('client-1', { accountNumber: '99999' }),
      ).rejects.toThrow(ConflictException);
      expect(clients.existsByBankAccount).toHaveBeenCalledWith(
        'bank-1',
        '99999',
        'client-1',
      );
      expect(clients.update).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('blocks deletion when the client has active or upcoming rentals', async () => {
      clients.hasActiveRentals.mockResolvedValue(true);

      await expect(service.delete('client-1')).rejects.toThrow(
        ConflictException,
      );
      expect(clients.deleteWithFinishedRentals).not.toHaveBeenCalled();
    });

    it('deletes a client with balance and only finished rentals', async () => {
      clients.findById.mockResolvedValue(makeClient(500));

      expect(await service.delete('client-1')).toBe(true);
      expect(
        clients.deleteWithFinishedRentals,
      ).toHaveBeenCalledExactlyOnceWith('client-1');
    });
  });
});
