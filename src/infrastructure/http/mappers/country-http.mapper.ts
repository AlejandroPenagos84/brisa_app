import { Country } from '@/domain/country.js';
import { CountryResponse } from '../dto/response/country.response.js';

export class CountryHttpMapper {
  static fromDomainToResponse(country: Country): CountryResponse {
    const data = country.getData();
    return { id: data.id, name: data.name };
  }
}
