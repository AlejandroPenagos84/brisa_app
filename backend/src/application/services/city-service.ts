import { City } from '@/domain/city.js';
import { UUID } from '@/utils/types.js';
import type { CityDetails } from '../models/city-details.js';
import type { CityRepository } from '../ports/out/repositories/city-repository.js';
import type { CountryRepository } from '../ports/out/repositories/country-repository.js';

// Plain class: city.module.ts builds it with useFactory, so the
// application layer does not depend on Nest
export class CityService {
  constructor(
    private readonly cityRepository: CityRepository,
    private readonly countryRepository: CountryRepository,
  ) {}

  async findAll(): Promise<CityDetails[]> {
    const items = await this.cityRepository.findAll();
    return this.loadDetails(items);
  }

  async findById(id: UUID): Promise<CityDetails | null> {
    const item = await this.cityRepository.findById(id);
    if (!item) return null;

    const [details] = await this.loadDetails([item]);
    return details;
  }

  async findByIds(ids: UUID[]): Promise<CityDetails[]> {
    const items = await this.cityRepository.findByIds(ids);
    return this.loadDetails(items);
  }

  private async loadDetails(items: City[]): Promise<CityDetails[]> {
    if (items.length === 0) return [];

    const countryIds = [...new Set(items.map((item) => item.getCountryId()))];
    const countries = await this.countryRepository.findByIds(countryIds);
    const countriesById = new Map(
      countries.map((country) => [country.getId(), country]),
    );

    return items.map((city) => {
      const country = countriesById.get(city.getCountryId());
      if (!country) {
        throw new Error(`Missing country for city ${city.getId()}`);
      }
      return { city, country };
    });
  }
}
