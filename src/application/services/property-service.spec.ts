import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { vi } from 'vitest';
import { BANK_REPOSITORY } from '@/application/ports/out/repositories/bank-repository.js';
import { CITY_REPOSITORY } from '@/application/ports/out/repositories/city-repository.js';
import { OWNER_REPOSITORY } from '@/application/ports/out/repositories/owner-repository.js';
import { PROPERTY_REPOSITORY } from '@/application/ports/out/repositories/property-repository.js';
import { PropertyService } from '@/application/services/property-service.js';
import { Property, PropertyStatus } from '@/domain/property.js';

const makeProperty = (manuallyInactive = false) =>
  new Property(
    'property-1',
    'owner-1',
    'city-1',
    'Calle 1',
    60,
    2,
    4,
    180,
    manuallyInactive,
  );

const owner = {
  getId: () => 'owner-1',
  getBankId: () => 'bank-1',
};

const city = {
  getId: () => 'city-1',
};

const bank = {
  getId: () => 'bank-1',
};

describe('PropertyService', () => {
  const properties = {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByIds: vi.fn(),
    findByOwnerId: vi.fn(),
    findByFilters: vi.fn(),
    findOccupiedPropertyIds: vi.fn(),
    hasActiveRentals: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    deleteWithPastRentals: vi.fn(),
  };
  const owners = {
    findById: vi.fn(),
    findByIds: vi.fn(),
  };
  const cities = {
    findById: vi.fn(),
    findByIds: vi.fn(),
  };
  const banks = {
    findByIds: vi.fn(),
  };

  let service: PropertyService;

  beforeEach(async () => {
    vi.resetAllMocks();

    properties.findAll.mockResolvedValue([]);
    properties.findOccupiedPropertyIds.mockResolvedValue([]);
    properties.hasActiveRentals.mockResolvedValue(false);
    properties.save.mockImplementation((property: Property) =>
      Promise.resolve(property),
    );
    properties.update.mockImplementation((_id: string, property: Property) =>
      Promise.resolve(property),
    );
    owners.findById.mockResolvedValue(owner);
    owners.findByIds.mockResolvedValue([owner]);
    cities.findById.mockResolvedValue(city);
    cities.findByIds.mockResolvedValue([city]);
    banks.findByIds.mockResolvedValue([bank]);

    const module = await Test.createTestingModule({
      providers: [
        PropertyService,
        { provide: PROPERTY_REPOSITORY, useValue: properties },
        { provide: OWNER_REPOSITORY, useValue: owners },
        { provide: BANK_REPOSITORY, useValue: banks },
        { provide: CITY_REPOSITORY, useValue: cities },
      ],
    }).compile();
    service = module.get(PropertyService);
  });

  describe('create', () => {
    const command = {
      ownerId: 'owner-1',
      cityId: 'city-1',
      address: 'Calle 1',
      area: 60,
      numberOfRooms: 2,
      capacity: 4,
      price: 180,
    };

    it('rejects a missing owner', async () => {
      owners.findById.mockResolvedValue(null);

      await expect(service.create(command)).rejects.toThrow(NotFoundException);
      expect(properties.save).not.toHaveBeenCalled();
    });

    it('rejects a missing city', async () => {
      cities.findById.mockResolvedValue(null);

      await expect(service.create(command)).rejects.toThrow(NotFoundException);
      expect(properties.save).not.toHaveBeenCalled();
    });

    it('saves the property when its relations exist', async () => {
      const property = await service.create(command);

      expect(property.getOwnerId()).toBe('owner-1');
      expect(property.getCityId()).toBe('city-1');
      expect(properties.save).toHaveBeenCalledOnce();
    });
  });

  describe('update status', () => {
    it('deactivates a property manually', async () => {
      properties.findById.mockResolvedValue(makeProperty());

      const updated = await service.update('property-1', {
        status: PropertyStatus.INACTIVE,
      });

      expect(updated.isManuallyInactive()).toBe(true);
      expect(updated.getStatus()).toBe(PropertyStatus.INACTIVE);
    });

    it('activates a property without active or upcoming rentals', async () => {
      properties.findById.mockResolvedValue(makeProperty(true));

      const updated = await service.update('property-1', {
        status: PropertyStatus.ACTIVE,
      });

      expect(updated.isManuallyInactive()).toBe(false);
      expect(updated.getStatus()).toBe(PropertyStatus.ACTIVE);
    });

    it('blocks activation while the property has rentals', async () => {
      properties.findById.mockResolvedValue(makeProperty(true));
      properties.findOccupiedPropertyIds.mockResolvedValue(['property-1']);

      await expect(
        service.update('property-1', { status: PropertyStatus.ACTIVE }),
      ).rejects.toThrow(ConflictException);
      expect(properties.update).not.toHaveBeenCalled();
    });
  });

  describe('occupancy', () => {
    it('reports an occupied property as inactive', async () => {
      properties.findAll.mockResolvedValue([makeProperty()]);
      properties.findOccupiedPropertyIds.mockResolvedValue(['property-1']);

      const [details] = await service.findAll();

      expect(details.property.getStatus()).toBe(PropertyStatus.INACTIVE);
    });
  });

  describe('delete', () => {
    it('blocks deletion when there are active or upcoming rentals', async () => {
      properties.hasActiveRentals.mockResolvedValue(true);

      await expect(service.delete('property-1')).rejects.toThrow(
        ConflictException,
      );
      expect(properties.deleteWithPastRentals).not.toHaveBeenCalled();
    });

    it('deletes the property and its past rentals', async () => {
      properties.deleteWithPastRentals.mockResolvedValue(true);

      expect(await service.delete('property-1')).toBe(true);
      expect(properties.deleteWithPastRentals).toHaveBeenCalledExactlyOnceWith(
        'property-1',
      );
    });

    it('throws not found when the property does not exist', async () => {
      properties.deleteWithPastRentals.mockResolvedValue(false);

      await expect(service.delete('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
