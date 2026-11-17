import { randomUUID } from 'node:crypto';
import {
  ConflictError,
  NotFoundError,
} from '@/application/errors/application-error.js';
import type { CreatePropertyCommand } from '../commands/create-property.command.js';
import {
  PropertyFilters,
  type PropertyRepository,
} from '@/application/ports/out/repositories/property-repository.js';
import { Property, PropertyStatus } from '@/domain/property.js';
import { UUID } from '@/utils/types.js';
import { UpdatePropertyCommand } from '../commands/update-property.command.js';
import type { PropertyDetails } from '../models/property-details.js';
import type { OwnerRepository } from '../ports/out/repositories/owner-repository.js';
import type { BankRepository } from '../ports/out/repositories/bank-repository.js';
import type { CityRepository } from '../ports/out/repositories/city-repository.js';

// Plain class: property.module.ts builds it with useFactory, so the
// application layer does not depend on Nest
export class PropertyService {
  constructor(
    private readonly propertyRepository: PropertyRepository,
    private readonly ownerRepository: OwnerRepository,
    private readonly bankRepository: BankRepository,
    private readonly cityRepository: CityRepository,
  ) {}

  async findByIds(ids: UUID[]): Promise<PropertyDetails[]> {
    const properties = await this.propertyRepository.findByIds(ids);
    return this.loadDetails(properties);
  }

  async findAll(): Promise<PropertyDetails[]> {
    const properties = await this.propertyRepository.findAll();
    return this.loadDetails(properties);
  }

  private async loadDetails(
    properties: Property[],
  ): Promise<PropertyDetails[]> {
    if (properties.length === 0) return [];

    const ownerIds = [
      ...new Set(properties.map((property) => property.getOwnerId())),
    ];
    const cityIds = [
      ...new Set(properties.map((property) => property.getCityId())),
    ];

    const [owners, cities, occupiedIds] = await Promise.all([
      this.ownerRepository.findByIds(ownerIds),
      this.cityRepository.findByIds(cityIds),
      this.propertyRepository.findOccupiedPropertyIds(
        properties.map((property) => property.getId()),
      ),
    ]);

    const bankIds = [...new Set(owners.map((owner) => owner.getBankId()))];
    const banks = await this.bankRepository.findByIds(bankIds);

    const ownersById = new Map(owners.map((owner) => [owner.getId(), owner]));
    const citiesById = new Map(cities.map((city) => [city.getId(), city]));
    const banksById = new Map(banks.map((bank) => [bank.getId(), bank]));
    const occupiedPropertyIds = new Set(occupiedIds);

    return properties.map((property) => {
      property.applyOccupancy(occupiedPropertyIds.has(property.getId()));

      const owner = ownersById.get(property.getOwnerId());
      const city = citiesById.get(property.getCityId());
      if (!owner || !city) {
        throw new Error(`Missing relations for property ${property.getId()}`);
      }

      const ownerBank = banksById.get(owner.getBankId());
      if (!ownerBank) {
        throw new Error(`Missing bank for owner ${owner.getId()}`);
      }

      return { property, owner, ownerBank, city };
    });
  }

  async findById(id: UUID): Promise<PropertyDetails | null> {
    const property = await this.propertyRepository.findById(id);
    if (!property) return null;

    const [details] = await this.loadDetails([property]);
    return details;
  }

  async findByOwnerId(ownerId: UUID): Promise<PropertyDetails[]> {
    const properties = await this.propertyRepository.findByOwnerId(ownerId);
    return this.loadDetails(properties);
  }

  async findByFilters(filters: PropertyFilters): Promise<PropertyDetails[]> {
    const properties = await this.propertyRepository.findByFilters(filters);
    return this.loadDetails(properties);
  }

  async create(command: CreatePropertyCommand): Promise<Property> {
    const [owner, city] = await Promise.all([
      this.ownerRepository.findById(command.ownerId),
      this.cityRepository.findById(command.cityId),
    ]);

    if (!owner) {
      throw new NotFoundError(
        `Owner with id ${command.ownerId} not found`,
      );
    }

    if (!city) {
      throw new NotFoundError(`City with id ${command.cityId} not found`);
    }

    const property = new Property(
      randomUUID(),
      command.ownerId,
      command.cityId,
      command.address,
      command.area,
      command.numberOfRooms,
      command.capacity,
      command.price,
    );

    return this.propertyRepository.save(property);
  }

  async update(id: UUID, command: UpdatePropertyCommand): Promise<Property> {
    const property = await this.propertyRepository.findById(id);
    if (!property) {
      throw new NotFoundError(`Property with id ${id} not found`);
    }

    this.applyFieldChanges(property, command);
    await this.applyStatusChange(id, property, command.status);

    const updated = await this.propertyRepository.update(id, property);
    await this.applyOccupancy([updated]);
    return updated;
  }

  private applyFieldChanges(
    property: Property,
    command: UpdatePropertyCommand,
  ): void {
    if (command.address !== undefined) {
      property.changeAddress(command.address);
    }
    if (command.area !== undefined) {
      property.changeArea(command.area);
    }
    if (command.numberOfRooms !== undefined) {
      property.changeNumberOfRooms(command.numberOfRooms);
    }
    if (command.capacity !== undefined) {
      property.changeCapacity(command.capacity);
    }
    if (command.price !== undefined) {
      property.changePrice(command.price);
    }
  }

  private async applyStatusChange(
    id: UUID,
    property: Property,
    status?: PropertyStatus,
  ): Promise<void> {
    if (status === undefined) return;

    if (status === PropertyStatus.INACTIVE) {
      if (!property.isManuallyInactive()) {
        property.deactivate();
      }
      return;
    }

    if (!property.isManuallyInactive()) return;

    const occupiedIds =
      await this.propertyRepository.findOccupiedPropertyIds([id]);

    if (occupiedIds.length > 0) {
      throw new ConflictError(
        `Property with id ${id} has active or upcoming rentals`,
      );
    }

    property.activate();
  }

  async delete(id: UUID): Promise<boolean> {
    if (await this.propertyRepository.hasActiveRentals(id)) {
      throw new ConflictError(
        `Property with id ${id} has active or upcoming rentals`,
      );
    }

    const deleted =
      await this.propertyRepository.deleteWithPastRentals(id);

    if (!deleted) {
      throw new NotFoundError(`Property with id ${id} not found`);
    }

    return true;
  }

  private async applyOccupancy(properties: Property[]): Promise<void> {
    if (properties.length === 0) return;

    const occupiedIds = await this.propertyRepository.findOccupiedPropertyIds(
      properties.map((property) => property.getId()),
    );
    const occupiedPropertyIds = new Set(occupiedIds);

    for (const property of properties) {
      property.applyOccupancy(occupiedPropertyIds.has(property.getId()));
    }
  }
}
