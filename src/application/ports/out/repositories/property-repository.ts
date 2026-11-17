import { Property } from '@/domain/property.js';
import { UUID } from '@/utils/types.js';

export const PROPERTY_REPOSITORY = Symbol('PropertyRepository');

export interface PropertyFilters {
  cityId?: UUID;
  countryId?: UUID;
  minPrice?: number;
  maxPrice?: number;
}

export interface PropertyRepository {
  findAll(): Promise<Property[]>;
  findByIds(ids: UUID[]): Promise<Property[]>;
  findById(id: UUID): Promise<Property | null>;
  // Locks the row until the transaction ends. Only valid inside UnitOfWork.run
  findByIdForUpdate(id: UUID): Promise<Property | null>;
  findByOwnerId(ownerId: UUID): Promise<Property[]>;
  findByFilters(filters: PropertyFilters): Promise<Property[]>;
  // Read side: ids of the properties with rentals not finished on today
  findOccupiedPropertyIds(propertyIds: UUID[], today: Date): Promise<UUID[]>;
  save(property: Property): Promise<Property>;
  update(id: UUID, property: Property): Promise<Property>;
  // Deletes the property and its rentals finished before today
  deleteWithPastRentals(propertyId: UUID, today: Date): Promise<boolean>;
}
