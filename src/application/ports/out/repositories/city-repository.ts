import { City } from '@/domain/city.js';
import { UUID } from '@/utils/types.js';

export const CITY_REPOSITORY = Symbol('CityRepository');

export interface CityRepository {
  findAll(): Promise<City[]>;
  findByIds(ids: UUID[]): Promise<City[]>;
  findById(id: UUID): Promise<City | null>;
}
