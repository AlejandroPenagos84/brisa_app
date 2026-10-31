import { Country } from '@/domain/country.js';
import { UUID } from '@/utils/types.js';

export interface CountryRepository {
  findAll(): Promise<Country[]>;
  findById(id: UUID): Promise<Country | null>;
}
