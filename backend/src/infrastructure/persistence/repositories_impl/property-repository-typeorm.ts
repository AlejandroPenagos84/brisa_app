import { NotFoundError } from '@/application/errors/application-error.js';
import {
  Between,
  EntityManager,
  FindOperator,
  FindOptionsWhere,
  In,
  LessThan,
  Not,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import {
  PropertyFilters,
  PropertyRepository,
} from '@/application/ports/out/repositories/property-repository.js';
import { Property } from '@/domain/property.js';
import { PropertyImageEntity } from '@/infrastructure/persistence/entities/property-image.entity.js';
import { PropertyEntity } from '@/infrastructure/persistence/entities/property.entity.js';
import { RentalEntity } from '@/infrastructure/persistence/entities/rental.entity.js';
import { PropertyMapper } from '@/infrastructure/persistence/mapper/property-mapper.js';
import { RentalMapper } from '@/infrastructure/persistence/mapper/rental-mapper.js';
import type { UUID } from '@/utils/types.js';

function priceRange(
  min?: number,
  max?: number,
): FindOperator<number> | undefined {
  if (min !== undefined && max !== undefined) return Between(min, max);
  if (min !== undefined) return MoreThanOrEqual(min);
  if (max !== undefined) return LessThanOrEqual(max);
  return undefined;
}

export class PropertyRepositoryTypeORM implements PropertyRepository {
  private readonly repository: Repository<PropertyEntity>;

  constructor(private readonly manager: EntityManager) {
    this.repository = manager.getRepository(PropertyEntity);
  }

  // Loads the images of all the entities in one query and maps them
  private async toDomain(entities: PropertyEntity[]): Promise<Property[]> {
    if (entities.length === 0) return [];

    const images = await this.manager.find(PropertyImageEntity, {
      where: { propertyId: In(entities.map((entity) => entity.id)) },
      order: { position: 'ASC' },
    });

    return entities.map((entity) => {
      entity.images = images.filter((image) => image.propertyId === entity.id);
      return PropertyMapper.fromEntityToDomain(entity);
    });
  }

  private async toDomainOne(entity: PropertyEntity | null): Promise<Property | null> {
    if (!entity) return null;
    const [property] = await this.toDomain([entity]);
    return property;
  }

  // Makes property_images match the aggregate: deletes the removed ones,
  // inserts the new ones and updates the positions of the rest
  private async syncImages(manager: EntityManager, property: Property): Promise<void> {
    const propertyId = property.getId();
    const images = PropertyMapper.imagesToEntities(property);
    const ids = images.map((image) => image.id);

    await manager.delete(PropertyImageEntity, {
      propertyId,
      ...(ids.length > 0 ? { id: Not(In(ids)) } : {}),
    });

    if (images.length === 0) return;

    const existing = await manager.find(PropertyImageEntity, {
      select: { id: true, position: true },
      where: { propertyId },
    });
    const positionById = new Map(existing.map((image) => [image.id, image.position]));

    const toInsert = images.filter((image) => !positionById.has(image.id));
    if (toInsert.length > 0) await manager.insert(PropertyImageEntity, toInsert);

    for (const image of images) {
      const current = positionById.get(image.id);
      if (current !== undefined && current !== image.position) {
        await manager.update(PropertyImageEntity, { id: image.id }, { position: image.position });
      }
    }
  }

  async findByIds(ids: UUID[]): Promise<Property[]> {
    if (ids.length === 0) return [];

    const entities = await this.repository.findBy({ id: In(ids) });
    return this.toDomain(entities);
  }

  async findAll(): Promise<Property[]> {
    const entities = await this.repository.find();
    return this.toDomain(entities);
  }

  async findById(id: UUID): Promise<Property | null> {
    const entity = await this.repository.findOneBy({ id });
    return this.toDomainOne(entity);
  }

  // Only the properties row is locked; its images are only changed through
  // this aggregate, so that lock also protects them
  async findByIdForUpdate(id: UUID): Promise<Property | null> {
    const entity = await this.repository.findOne({
      where: { id },
      lock: { mode: 'pessimistic_write' }, // SELECT ... FOR UPDATE
    });
    return this.toDomainOne(entity);
  }

  async findByOwnerId(ownerId: UUID): Promise<Property[]> {
    const entities = await this.repository.findBy({ ownerId });
    return this.toDomain(entities);
  }

  async findByFilters(filters: PropertyFilters): Promise<Property[]> {
    const { cityId, countryId, minPrice, maxPrice } = filters;
    const where: FindOptionsWhere<PropertyEntity> = {};

    if (cityId) where.cityId = cityId;

    if (countryId) where.city = { countryId };

    const price = priceRange(minPrice, maxPrice);
    if (price) where.pricePerNight = price;

    const entities = await this.repository.findBy(where);
    return this.toDomain(entities);
  }

  async findOccupiedPropertyIds(
    propertyIds: UUID[],
    today: Date,
  ): Promise<UUID[]> {
    if (propertyIds.length === 0) return [];

    const rows = await this.repository
      .createQueryBuilder('property')
      .innerJoin('property.rentals', 'rental')
      .select('property.id', 'id')
      .where('property.id IN (:...propertyIds)', { propertyIds })
      .andWhere('rental.checkOutDate >= :today', {
        today: RentalMapper.toDateColumn(today),
      })
      .distinct(true)
      .getRawMany<{ id: string }>();

    return rows.map((row) => row.id);
  }

  async save(property: Property): Promise<Property> {
    await this.manager.transaction(async (manager) => {
      await manager.insert(PropertyEntity, PropertyMapper.fromDomainToEntity(property));
      await this.syncImages(manager, property);
    });
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

    await this.manager.transaction(async (manager) => {
      await manager.save(PropertyEntity, PropertyMapper.fromDomainToEntity(property));
      await this.syncImages(manager, property);
    });
    return property;
  }

  async deleteWithPastRentals(propertyId: UUID, today: Date): Promise<boolean> {
    return this.manager.transaction(async (manager) => {
      await manager.delete(RentalEntity, {
        propertyId,
        checkOutDate: LessThan(RentalMapper.toDateColumn(today)),
      });

      const result = await manager.delete(PropertyEntity, { id: propertyId });
      return (result.affected ?? 0) > 0;
    });
  }
}
