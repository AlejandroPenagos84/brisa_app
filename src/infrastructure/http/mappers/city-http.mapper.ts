import { randomUUID } from 'node:crypto';
import { City } from '@/domain/city.js';
import type { CityDetails } from '@/application/models/city-details.js';
import {
  CityResponse,
  CityDetailsResponse,
} from '../dto/response/city.response.js';
import { CountryHttpMapper } from './country-http.mapper.js';
import { CreateCityRequest } from '../dto/request/create/create-city.request.js';
import { UpdateCityRequest } from '../dto/request/update/update-city.request.js';
import { omitUndefined, trimText } from './mapping.utils.js';

export class CityHttpMapper {
  static fromCreateRequestToDomain(request: CreateCityRequest): City {
    return new City(randomUUID(), trimText(request.name), request.countryId);
  }

  static fromUpdateRequestToData(
    request: UpdateCityRequest,
  ): Partial<ReturnType<City['getData']>> {
    return omitUndefined({
      name: trimText(request.name),
      countryId: request.countryId,
    });
  }

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
