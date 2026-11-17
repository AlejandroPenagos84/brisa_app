import type { CreatePropertyCommand } from '@/application/commands/create-property.command.js';
import type { PropertyDetails } from '@/application/models/property-details.js';
import type { UpdatePropertyCommand } from '@/application/commands/update-property.command.js';
import { Property } from '@/domain/property.js';
import { CreatePropertyRequest } from '../dto/request/create/create-property.request.js';
import {
  PropertyResponse,
  PropertyDetailsResponse,
} from '../dto/response/property.response.js';
import { UpdatePropertyRequest } from '../dto/request/update/update-property.request.js';
import { OwnerHttpMapper } from './owner-http.mapper.js';

// The API keeps the field "price"; the domain calls it pricePerNight
export class PropertyHttpMapper {
  static fromCreateRequestToCommand(
    ownerId: string,
    request: CreatePropertyRequest,
  ): CreatePropertyCommand {
    return {
      ownerId,
      cityId: request.cityId,
      address: request.address,
      area: request.area,
      numberOfRooms: request.numberOfRooms,
      capacity: request.capacity,
      pricePerNight: request.price,
    };
  }

  static fromUpdateRequestToCommand(
    request: UpdatePropertyRequest,
  ): UpdatePropertyCommand {
    return {
      address: request.address,
      area: request.area,
      numberOfRooms: request.numberOfRooms,
      capacity: request.capacity,
      pricePerNight: request.price,
      status: request.status,
    };
  }

  static fromDomainToResponse(property: Property): PropertyResponse {
    const data = property.getData();
    return {
      id: data.id,
      ownerId: data.ownerId,
      cityId: data.cityId,
      address: data.address,
      area: data.area,
      numberOfRooms: data.numberOfRooms,
      capacity: data.capacity,
      price: data.pricePerNight,
      status: data.status,
    };
  }

  static fromDetailsToResponse(
    details: PropertyDetails,
  ): PropertyDetailsResponse {
    const { property, owner, ownerBank, city } = details;
    return {
      ...this.fromDomainToResponse(property),
      owner: OwnerHttpMapper.fromDomainWithBankToPublicResponse(
        owner,
        ownerBank,
      ),
      city: { id: city.getId(), name: city.getName() },
    };
  }
}
