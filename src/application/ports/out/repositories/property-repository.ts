import { Property } from '@/domain/property.js';
import { UUID } from '@/utils/types.js';

export interface PropertyFilters {
  cityId?: UUID;
  countryId?: UUID;
  minPrice?: number;
  maxPrice?: number;
}

export interface PropertyRepository {
  findAll(): Promise<Property[]>;
  findById(id: UUID): Promise<Property | null>;
  findByOwnerId(ownerId: UUID): Promise<Property[]>;
  findByFilters(filters: PropertyFilters): Promise<Property[]>;
  save(property: Property): Promise<Property>;
  update(id: UUID, property: Property): Promise<Property>;
  delete(id: UUID): Promise<boolean>;
}
