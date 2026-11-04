import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { vi } from 'vitest';
import { CLIENT_REPOSITORY } from '@/application/ports/out/repositories/client-repository.js';
import { PROPERTY_REPOSITORY } from '@/application/ports/out/repositories/property-repository.js';
import { RENTAL_REPOSITORY } from '@/application/ports/out/repositories/rental-repository.js';
import { RentalService } from '@/application/services/rental-service.js';
import { Client } from '@/domain/client.js';
import { Property } from '@/domain/property.js';
import { Rental } from '@/domain/rental.js';

describe('RentalService checkout', () => {
  const rentals = {
    findAll: vi.fn(),
    findByClientId: vi.fn(),
    findByKeys: vi.fn(),
    findByKey: vi.fn(),
    saveWithClient: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const clients = {
    findAll: vi.fn(),
    findByIds: vi.fn(),
    findById: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const properties = {
    findAll: vi.fn(),
    findByIds: vi.fn(),
    findById: vi.fn(),
    findByOwnerId: vi.fn(),
    findByFilters: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  const makeRental = (start = '2026-11-10', end = '2026-11-15') =>
    new Rental(
      'property-1',
      'client-1',
      new Date(`${start}T00:00:00.000Z`),
      new Date(`${end}T00:00:00.000Z`),
    );

  const makeClient = (balance = 1000) =>
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

  const makeProperty = (price = 180) =>
    new Property(
      'property-1',
      'owner-1',
      'city-1',
      'Calle 1',
      60,
      2,
      4,
      price,
    );

  let service: RentalService;

  beforeEach(async () => {
    vi.resetAllMocks();
    rentals.findByKey.mockResolvedValue(null);
    rentals.saveWithClient.mockImplementation((rental: Rental) =>
      Promise.resolve(rental),
    );
    clients.findById.mockResolvedValue(makeClient());
    properties.findById.mockResolvedValue(makeProperty());

    const module = await Test.createTestingModule({
      providers: [
        RentalService,
        { provide: RENTAL_REPOSITORY, useValue: rentals },
        { provide: CLIENT_REPOSITORY, useValue: clients },
        { provide: PROPERTY_REPOSITORY, useValue: properties },
      ],
    }).compile();
    service = module.get(RentalService);
  });

  it('charges nights times price and saves both aggregates', async () => {
    const rental = makeRental();
    const client = makeClient(1000);
    clients.findById.mockResolvedValue(client);

    await service.save(rental);

    expect(client.getBalance()).toBe(100);
    expect(rentals.saveWithClient).toHaveBeenCalledExactlyOnceWith(
      rental,
      client,
    );
  });

  it('rounds the total to two decimals', async () => {
    const client = makeClient(1000);
    clients.findById.mockResolvedValue(client);
    properties.findById.mockResolvedValue(makeProperty(180.55));

    await service.save(makeRental('2026-11-10', '2026-11-13'));

    expect(client.getBalance()).toBe(458.35);
  });

  it('rejects the rental when the balance is insufficient', async () => {
    const client = makeClient(100);
    clients.findById.mockResolvedValue(client);

    await expect(service.save(makeRental())).rejects.toThrow(
      BadRequestException,
    );

    expect(client.getBalance()).toBe(100);
    expect(rentals.saveWithClient).not.toHaveBeenCalled();
  });

  it('rejects a rental that already exists', async () => {
    rentals.findByKey.mockResolvedValue(makeRental());
    const client = makeClient();
    clients.findById.mockResolvedValue(client);

    await expect(service.save(makeRental())).rejects.toThrow(
      ConflictException,
    );

    expect(client.getBalance()).toBe(1000);
    expect(rentals.saveWithClient).not.toHaveBeenCalled();
  });
});
