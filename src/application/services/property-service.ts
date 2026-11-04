import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CreatePropertyCommand } from '../commands/create-property.command.js';
import {
  PROPERTY_REPOSITORY,
  PropertyFilters,
  type PropertyRepository,
} from '@/application/ports/out/repositories/property-repository.js';
import { Property } from '@/domain/property.js';
import { UUID } from '@/utils/types.js';
import { UpdatePropertyCommand } from '../commands/update-property.command.js';
import type { PropertyDetails } from '../models/property-details.js';
import {
  OWNER_REPOSITORY,
  type OwnerRepository,
} from '../ports/out/repositories/owner-repository.js';
import {
  BANK_REPOSITORY,
  type BankRepository,
} from '../ports/out/repositories/bank-repository.js';
import {
  CITY_REPOSITORY,
  type CityRepository,
} from '../ports/out/repositories/city-repository.js';

@Injectable()
export class PropertyService {
  constructor(
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
    @Inject(OWNER_REPOSITORY)
    private readonly ownerRepository: OwnerRepository,
    @Inject(BANK_REPOSITORY)
    private readonly bankRepository: BankRepository,
    @Inject(CITY_REPOSITORY)
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

    const [owners, cities] = await Promise.all([
      this.ownerRepository.findByIds(ownerIds),
      this.cityRepository.findByIds(cityIds),
    ]);

    const bankIds = [...new Set(owners.map((owner) => owner.getBankId()))];
    const banks = await this.bankRepository.findByIds(bankIds);

    const ownersById = new Map(owners.map((owner) => [owner.getId(), owner]));
    const citiesById = new Map(cities.map((city) => [city.getId(), city]));
    const banksById = new Map(banks.map((bank) => [bank.getId(), bank]));

    return properties.map((property) => {
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
    let property: Property;

    try {
      property = new Property(
        randomUUID(),
        command.ownerId,
        command.cityId,
        command.address,
        command.area,
        command.numberOfRooms,
        command.capacity,
        command.price,
      );
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      throw new BadRequestException(error.message);
    }

    return this.propertyRepository.save(property);
  }

  async update(id: UUID, property: UpdatePropertyCommand): Promise<Property> {
    const existingProperty = await this.propertyRepository.findById(id);
    if (!existingProperty) {
      throw new NotFoundException(`Property with id ${id} not found`);
    }

    try {
      if (property.address !== undefined) {
        existingProperty.changeAddress(property.address);
      }
      if (property.area !== undefined) {
        existingProperty.changeArea(property.area);
      }
      if (property.numberOfRooms !== undefined) {
        existingProperty.changeNumberOfRooms(property.numberOfRooms);
      }
      if (property.capacity !== undefined) {
        existingProperty.changeCapacity(property.capacity);
      }
      if (property.price !== undefined) {
        existingProperty.changePrice(property.price);
      }
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      throw new BadRequestException(error.message);
    }

    return this.propertyRepository.update(id, existingProperty);
  }

  async delete(id: UUID): Promise<boolean> {
    return this.propertyRepository.delete(id);
  }
}
