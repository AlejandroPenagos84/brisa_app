import { Country } from '@/domain/country.js';
import type { UUID } from '@/utils/types.js';

export const COUNTRY_REPOSITORY = Symbol('CountryRepository');

export interface CountryRepository {
  findAll(): Promise<Country[]>;
  findByIds(ids: UUID[]): Promise<Country[]>;
  findById(id: UUID): Promise<Country | null>;
}
