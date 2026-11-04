import { businessToday } from '@/utils/business-date.js';
import { NotFoundError } from '@/application/errors/application-error.js';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  In,
  FindOperator,
  FindOptionsWhere,
  LessThan,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import {
  PropertyFilters,
  PropertyRepository,
} from '@/application/ports/out/repositories/property-repository.js';
import { Property } from '@/domain/property.js';
import { PropertyEntity } from '@/infrastructure/persistence/entities/property.entity.js';
import { RentalEntity } from '@/infrastructure/persistence/entities/rental.entity.js';
import { PropertyMapper } from '@/infrastructure/persistence/mapper/property-mapper.js';
import { UUID } from '@/utils/types.js';

function priceRange(
  min?: number,
  max?: number,
): FindOperator<number> | undefined {
  if (min !== undefined && max !== undefined) return Between(min, max);
  if (min !== undefined) return MoreThanOrEqual(min);
  if (max !== undefined) return LessThanOrEqual(max);
  return undefined;
}

@Injectable()
export class PropertyRepositoryTypeORM implements PropertyRepository {
  constructor(
    @InjectRepository(PropertyEntity)
    private readonly repository: Repository<PropertyEntity>,
  ) {}

  async findByIds(ids: UUID[]): Promise<Property[]> {
    if (ids.length === 0) return [];

    const entities = await this.repository.findBy({ id: In(ids) });
    return entities.map((entity) => PropertyMapper.fromEntityToDomain(entity));
  }

  async findAll(): Promise<Property[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => PropertyMapper.fromEntityToDomain(entity));
  }

  async findById(id: UUID): Promise<Property | null> {
    const entity = await this.repository.findOneBy({ id });
    return entity ? PropertyMapper.fromEntityToDomain(entity) : null;
  }

  async findByOwnerId(ownerId: UUID): Promise<Property[]> {
    const entities = await this.repository.findBy({ ownerId });
    return entities.map((entity) => PropertyMapper.fromEntityToDomain(entity));
  }

  async findByFilters(filters: PropertyFilters): Promise<Property[]> {
    const { cityId, countryId, minPrice, maxPrice } = filters;
    const where: FindOptionsWhere<PropertyEntity> = {};

    if (cityId) where.cityId = cityId;

    if (countryId) where.city = { countryId };

    const price = priceRange(minPrice, maxPrice);
    if (price) where.pricePerNight = price;

    const entities = await this.repository.findBy(where);
    return entities.map((entity) => PropertyMapper.fromEntityToDomain(entity));
  }

  async findOccupiedPropertyIds(propertyIds: UUID[]): Promise<UUID[]> {
    if (propertyIds.length === 0) return [];

    const today = businessToday();
    const rows = await this.repository
      .createQueryBuilder('property')
      .innerJoin('property.rentals', 'rental')
      .select('property.id', 'id')
      .where('property.id IN (:...propertyIds)', { propertyIds })
      .andWhere('rental.checkOutDate >= :today', { today })
      .distinct(true)
      .getRawMany<{ id: string }>();

    return rows.map((row) => row.id);
  }

  async hasActiveRentals(propertyId: UUID): Promise<boolean> {
    const today = businessToday();
    const count = await this.repository
      .createQueryBuilder('property')
      .innerJoin('property.rentals', 'rental')
      .where('property.id = :propertyId', { propertyId })
      .andWhere('rental.checkOutDate >= :today', { today })
      .getCount();

    return count > 0;
  }

  async save(property: Property): Promise<Property> {
    await this.repository.insert(PropertyMapper.fromDomainToEntity(property));
    return property;
  }

  async update(id: UUID, property: Property): Promise<Property> {
    if (property.getData().id !== id) {
      throw new Error('The property id does not match');
    }

    const exists = await this.repository.existsBy({ id });
    if (!exists) {
      throw new NotFoundError(`Property with id ${id} not found`);
    }

    const saved = await this.repository.save(
      PropertyMapper.fromDomainToEntity(property),
    );
    return PropertyMapper.fromEntityToDomain(saved);
  }

  async deleteWithPastRentals(propertyId: UUID): Promise<boolean> {
    const today = businessToday();

    return this.repository.manager.transaction(async (manager) => {
      await manager.delete(RentalEntity, {
        propertyId,
        checkOutDate: LessThan(today),
      });

      const result = await manager.delete(PropertyEntity, { id: propertyId });
      return (result.affected ?? 0) > 0;
    });
  }
}
