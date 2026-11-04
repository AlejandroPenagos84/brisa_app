import { Country } from '@/domain/country.js';
import { UUID } from '@/utils/types.js';
import { Inject, Injectable } from '@nestjs/common';
import {
  COUNTRY_REPOSITORY,
  type CountryRepository,
} from '@/application/ports/out/repositories/country-repository.js';

@Injectable()
export class CountryService {
  constructor(
    @Inject(COUNTRY_REPOSITORY)
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
