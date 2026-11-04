import { randomUUID } from 'node:crypto';
import { Country } from '@/domain/country.js';
import { CountryResponse } from '../dto/response/country.response.js';
import { CreateCountryRequest } from '../dto/request/create/create-country.request.js';
import { UpdateCountryRequest } from '../dto/request/update/update-country.request.js';
import { omitUndefined, trimText } from './mapping.utils.js';

export class CountryHttpMapper {
  static fromCreateRequestToDomain(request: CreateCountryRequest): Country {
    return new Country(randomUUID(), trimText(request.name));
  }

  static fromUpdateRequestToData(
    request: UpdateCountryRequest,
  ): Partial<ReturnType<Country['getData']>> {
    return omitUndefined({
      name: trimText(request.name),
    });
  }

  static fromDomainToResponse(country: Country): CountryResponse {
    const data = country.getData();
    return { id: data.id, name: data.name };
  }
}
