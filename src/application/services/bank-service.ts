import { Inject, Injectable } from '@nestjs/common';
import { Bank } from '@/domain/bank.js';
import { UUID } from '@/utils/types.js';
import type { BankDetails } from '../models/bank-details.js';
import {
  BANK_REPOSITORY,
  type BankRepository,
} from '../ports/out/repositories/bank-repository.js';
import {
  COUNTRY_REPOSITORY,
  type CountryRepository,
} from '../ports/out/repositories/country-repository.js';

@Injectable()
export class BankService {
  constructor(
    @Inject(BANK_REPOSITORY)
    private readonly bankRepository: BankRepository,
    @Inject(COUNTRY_REPOSITORY)
    private readonly countryRepository: CountryRepository,
  ) {}

  async findAll(): Promise<BankDetails[]> {
    const items = await this.bankRepository.findAll();
    return this.loadDetails(items);
  }

  async findById(id: UUID): Promise<BankDetails | null> {
    const item = await this.bankRepository.findById(id);
    if (!item) return null;

    const [details] = await this.loadDetails([item]);
    return details;
  }

  async findByIds(ids: UUID[]): Promise<BankDetails[]> {
    const items = await this.bankRepository.findByIds(ids);
    return this.loadDetails(items);
  }

  private async loadDetails(items: Bank[]): Promise<BankDetails[]> {
    if (items.length === 0) return [];

    const countryIds = [...new Set(items.map((item) => item.getCountryId()))];
    const countries = await this.countryRepository.findByIds(countryIds);
    const countriesById = new Map(
      countries.map((country) => [country.getId(), country]),
    );

    return items.map((bank) => {
      const country = countriesById.get(bank.getCountryId());
      if (!country) {
        throw new Error(`Missing country for bank ${bank.getId()}`);
      }
      return { bank, country };
    });
  }
}
