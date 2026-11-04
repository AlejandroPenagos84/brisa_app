import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  In,
  FindOperator,
  FindOptionsWhere,
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
      throw new Error(`Property with id ${id} not found`);
    }

    const saved = await this.repository.save(
      PropertyMapper.fromDomainToEntity(property),
    );
    return PropertyMapper.fromEntityToDomain(saved);
  }

  async delete(id: UUID): Promise<boolean> {
    const result = await this.repository.delete({ id });
    return (result.affected ?? 0) > 0;
  }
}
