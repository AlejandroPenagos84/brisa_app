import type { RentalDetails } from '@/application/models/rental-details.js';
import { Rental } from '@/domain/rental.js';
import { CreateRentalRequest } from '../dto/request/create/create-rental.request.js';
import {
  RentalResponse,
  RentalDetailsResponse,
} from '../dto/response/rental.response.js';
import { UpdateRentalRequest } from '../dto/request/update/update-rental.request.js';
import { omitUndefined, toDate } from './mapping.utils.js';

export class RentalHttpMapper {
  static fromCreateRequestToDomain(request: CreateRentalRequest): Rental {
    return new Rental(
      request.propertyId,
      request.clientId,
      toDate(request.startDate),
      toDate(request.endDate),
    );
  }

  static fromUpdateRequestToData(
    request: UpdateRentalRequest,
  ): Partial<ReturnType<Rental['getData']>> {
    return omitUndefined({
      propertyId: request.propertyId,
      clientId: request.clientId,
      startDate: toDate(request.startDate),
      endDate: toDate(request.endDate),
    });
  }

  static fromDomainToResponse(rental: Rental): RentalResponse {
    return { ...rental.getData() };
  }

  static fromDetailsToResponse(details: RentalDetails): RentalDetailsResponse {
    return {
      ...details.rental.getData(),
      property: { ...details.property.getData() },
      client: { ...details.client.getData() },
    };
  }
}
