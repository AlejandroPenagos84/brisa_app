import { City } from '@/domain/city.js';
import type { CityDetails } from '@/application/models/city-details.js';
import {
  CityResponse,
  CityDetailsResponse,
} from '../dto/response/city.response.js';
import { CountryHttpMapper } from './country-http.mapper.js';

export class CityHttpMapper {
  static fromDomainToResponse(city: City): CityResponse {
    const data = city.getData();
    return {
      id: data.id,
      name: data.name,
      countryId: data.countryId,
    };
  }

  static fromDetailsToResponse(details: CityDetails): CityDetailsResponse {
    return {
      ...this.fromDomainToResponse(details.city),
      country: CountryHttpMapper.fromDomainToResponse(details.country),
    };
  }
}
