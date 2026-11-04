import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { vi } from 'vitest';
import { CLIENT_REPOSITORY } from '@/application/ports/out/repositories/client-repository.js';
import { PROPERTY_REPOSITORY } from '@/application/ports/out/repositories/property-repository.js';
import { RENTAL_REPOSITORY } from '@/application/ports/out/repositories/rental-repository.js';
import { RentalService } from '@/application/services/rental-service.js';
import { Client } from '@/domain/client.js';
import { Property, PropertyStatus } from '@/domain/property.js';
import { Rental, RentalStatus } from '@/domain/rental.js';

describe('Rental status', () => {
  const rentals = {
    findAll: vi.fn(),
    findByClientId: vi.fn(),
    findByKeys: vi.fn(),
    findByKey: vi.fn(),
    hasOverlappingPropertyRental: vi.fn(),
    hasOverlappingClientRental: vi.fn(),
    updateStatuses: vi.fn(),
    saveWithClient: vi.fn(),
    update: vi.fn(),
    deleteWithClient: vi.fn(),
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
    findOccupiedPropertyIds: vi.fn(),
    hasActiveRentals: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    deleteWithPastRentals: vi.fn(),
  };

  const makeRental = (
    start: string,
    end: string,
    chargedAmount = 0,
    status = RentalStatus.UPCOMING,
  ) =>
    new Rental(
      'property-1',
      'client-1',
      new Date(`${start}T00:00:00.000Z`),
      new Date(`${end}T00:00:00.000Z`),
      chargedAmount,
      status,
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

  const property = new Property(
    'property-1',
    'owner-1',
    'city-1',
    'Calle 1',
    60,
    2,
    4,
    180,
  );

  let service: RentalService;

  beforeEach(async () => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-04T12:00:00.000Z'));
    rentals.findByKey.mockResolvedValue(null);
    rentals.hasOverlappingPropertyRental.mockResolvedValue(false);
    rentals.hasOverlappingClientRental.mockResolvedValue(false);
    rentals.saveWithClient.mockImplementation((rental: Rental) =>
      Promise.resolve(rental),
    );
    rentals.updateStatuses.mockResolvedValue(undefined);
    clients.findById.mockResolvedValue(makeClient());
    clients.findByIds.mockResolvedValue([makeClient()]);
    properties.findById.mockResolvedValue(property);
    properties.findByIds.mockResolvedValue([property]);
    properties.findOccupiedPropertyIds.mockResolvedValue([]);

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

  afterEach(() => {
    vi.useRealTimers();
  });

  it('derives UPCOMING, ACTIVE and FINISHED from the dates', () => {
    const now = new Date('2026-11-04T12:00:00.000Z');
    const upcoming = makeRental('2026-11-10', '2026-11-15');
    const active = makeRental('2026-11-01', '2026-11-10');
    const finished = makeRental('2026-10-01', '2026-10-05');

    upcoming.refreshStatus(now);
    active.refreshStatus(now);
    finished.refreshStatus(now);

    expect(upcoming.getStatus()).toBe(RentalStatus.UPCOMING);
    expect(active.getStatus()).toBe(RentalStatus.ACTIVE);
    expect(finished.getStatus()).toBe(RentalStatus.FINISHED);
  });

  it('sets UPCOMING when creating a future rental', async () => {
    const rental = makeRental('2026-11-10', '2026-11-15');

    await service.save(rental);

    expect(rental.getStatus()).toBe(RentalStatus.UPCOMING);
  });

  it('sets ACTIVE when creating a rental that starts today', async () => {
    const rental = makeRental('2026-11-04', '2026-11-05');

    await service.save(rental);

    expect(rental.getStatus()).toBe(RentalStatus.ACTIVE);
  });

  it('rejects a rental that starts in the past', async () => {
    const rental = makeRental('2026-11-03', '2026-11-05');

    await expect(service.save(rental)).rejects.toThrow(BadRequestException);
    expect(rentals.saveWithClient).not.toHaveBeenCalled();
  });

  it('rejects a rental for a manually inactive property', async () => {
    const inactiveProperty = new Property(
      'property-1',
      'owner-1',
      'city-1',
      'Calle 1',
      60,
      2,
      4,
      180,
      true,
    );
    properties.findById.mockResolvedValue(inactiveProperty);
    const rental = makeRental('2026-11-10', '2026-11-15');

    await expect(service.save(rental)).rejects.toThrow(ConflictException);
    expect(rentals.saveWithClient).not.toHaveBeenCalled();
  });

  it('allows a rental when the property is occupied but manually active', async () => {
    properties.findOccupiedPropertyIds.mockResolvedValue(['property-1']);
    const rental = makeRental('2026-11-10', '2026-11-15');

    await service.save(rental);

    expect(rentals.saveWithClient).toHaveBeenCalledOnce();
  });

  it('rejects a rental that overlaps another property rental', async () => {
    rentals.hasOverlappingPropertyRental.mockResolvedValue(true);
    const rental = makeRental('2026-11-10', '2026-11-15');

    await expect(service.save(rental)).rejects.toThrow(ConflictException);
    expect(rentals.saveWithClient).not.toHaveBeenCalled();
  });

  it('rejects a rental that overlaps another client rental', async () => {
    rentals.hasOverlappingClientRental.mockResolvedValue(true);
    const rental = makeRental('2026-11-10', '2026-11-15');

    await expect(service.save(rental)).rejects.toThrow(ConflictException);
    expect(rentals.saveWithClient).not.toHaveBeenCalled();
  });

  it('reports an occupied property as inactive in rental details', async () => {
    const rental = makeRental('2026-10-01', '2026-10-05');
    rentals.findByKey.mockResolvedValue(rental);
    properties.findOccupiedPropertyIds.mockResolvedValue(['property-1']);

    const details = await service.findByKey(rental.getKey());

    expect(details?.property.getStatus()).toBe(PropertyStatus.INACTIVE);
  });

  it('refreshes stale statuses when reading', async () => {
    const rental = makeRental('2026-10-01', '2026-10-05');
    rentals.findByKey.mockResolvedValue(rental);

    const details = await service.findByKey(rental.getKey());

    expect(details?.rental.getStatus()).toBe(RentalStatus.FINISHED);
    expect(rentals.updateStatuses).toHaveBeenCalledExactlyOnceWith([rental]);
  });

  it('refunds a rental that has not started', async () => {
    const client = makeClient(100);
    const rental = makeRental('2026-11-10', '2026-11-15', 900);
    rentals.findByKey.mockResolvedValue(rental);
    rentals.deleteWithClient.mockResolvedValue(true);
    clients.findByIds.mockResolvedValue([client]);
    properties.findByIds.mockResolvedValue([property]);

    expect(await service.cancel(rental.getKey())).toBe(true);
    expect(client.getBalance()).toBe(1000);
  });

  it('rejects cancelling an already started rental', async () => {
    const rental = makeRental('2026-11-03', '2026-11-05', 360);
    rentals.findByKey.mockResolvedValue(rental);

    await expect(service.cancel(rental.getKey())).rejects.toThrow(
      BadRequestException,
    );
    expect(rentals.deleteWithClient).not.toHaveBeenCalled();
  });

  it('rejects cancelling a missing rental', async () => {
    await expect(
      service.cancel({
        propertyId: 'property-1',
        clientId: 'client-1',
        startDate: new Date('2026-11-10T00:00:00.000Z'),
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('refreshes every rental for the scheduler', async () => {
    const stale = makeRental('2026-10-01', '2026-10-05');
    rentals.findAll.mockResolvedValue([stale]);

    expect(await service.refreshAllStatuses()).toBe(1);
    expect(stale.getStatus()).toBe(RentalStatus.FINISHED);
    expect(rentals.updateStatuses).toHaveBeenCalledExactlyOnceWith([stale]);
  });
});
