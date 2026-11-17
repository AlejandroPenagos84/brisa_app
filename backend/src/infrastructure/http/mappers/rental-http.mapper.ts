import type { ReservePropertyCommand } from '@/application/commands/reserve-property.command.js';
import type { RentalDetails } from '@/application/models/rental-details.js';
import type { Rental } from '@/domain/rental.js';
import { CreateRentalRequest } from '@/infrastructure/http/dto/request/create/create-rental.request.js';
import {
  RentalResponse,
  RentalDetailsResponse,
} from '@/infrastructure/http/dto/response/rental.response.js';
import { ClientHttpMapper } from './client-http.mapper.js';
import { toDate } from './mapping.utils.js';
import { PropertyHttpMapper } from './property-http.mapper.js';

export class RentalHttpMapper {
  // The client creates the rental in the domain (Client.reserveProperty);
  // HTTP only sends the data
  static fromCreateRequestToCommand(
    request: CreateRentalRequest,
  ): ReservePropertyCommand {
    return {
      propertyId: request.propertyId,
      clientId: request.clientId,
      startDate: toDate(request.startDate),
      endDate: toDate(request.endDate),
    };
  }

  // Explicit fields: the response does not change with the domain
  static fromDomainToResponse(rental: Rental): RentalResponse {
    const data = rental.getData();
    return {
      propertyId: data.propertyId,
      clientId: data.clientId,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status,
    };
  }

  static fromDetailsToResponse(details: RentalDetails): RentalDetailsResponse {
    return {
      ...this.fromDomainToResponse(details.rental),
      property: PropertyHttpMapper.fromDomainToResponse(details.property),
      client: ClientHttpMapper.fromDomainToBasicResponse(details.client),
    };
  }
}
