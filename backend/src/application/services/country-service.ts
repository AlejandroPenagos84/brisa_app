import { Country } from '@/domain/country.js';
import { UUID } from '@/utils/types.js';
import type { CountryRepository } from '@/application/ports/out/repositories/country-repository.js';

// Plain class: country.module.ts builds it with useFactory, so the
// application layer does not depend on Nest
export class CountryService {
  constructor(
    private readonly countryRepository: CountryRepository,
  ) {}

  async findByIds(ids: UUID[]): Promise<Country[]> {
    return this.countryRepository.findByIds(ids);
  }

  async findAll(): Promise<Country[]> {
    return this.countryRepository.findAll();
  }

  async findById(id: UUID): Promise<Country | null> {
    return this.countryRepository.findById(id);
  }
}
