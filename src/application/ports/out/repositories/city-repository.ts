import { City } from '@/domain/city.js';
import { UUID } from '@/utils/types.js';

export interface CityRepository {
  findAll(): Promise<City[]>;
  findById(id: UUID): Promise<City | null>;
}
