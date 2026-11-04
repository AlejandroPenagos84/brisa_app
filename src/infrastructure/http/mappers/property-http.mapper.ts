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
import { trimText } from './mapping.utils.js';
import { OwnerHttpMapper } from './owner-http.mapper.js';

export class PropertyHttpMapper {
  static fromCreateRequestToCommand(
    request: CreatePropertyRequest,
  ): CreatePropertyCommand {
    return {
      ownerId: request.ownerId,
      cityId: request.cityId,
      address: trimText(request.address),
      area: request.area,
      numberOfRooms: request.numberOfRooms,
      capacity: request.capacity,
      price: request.price,
    };
  }

  static fromUpdateRequestToCommand(
    request: UpdatePropertyRequest,
  ): UpdatePropertyCommand {
    return {
      address: trimText(request.address),
      area: request.area,
      numberOfRooms: request.numberOfRooms,
      capacity: request.capacity,
      price: request.price,
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
      price: data.price,
      status: data.status,
    };
  }

  static fromDetailsToResponse(
    details: PropertyDetails,
  ): PropertyDetailsResponse {
    const { property, owner, ownerBank, city } = details;
    return {
      ...this.fromDomainToResponse(property),
      owner: OwnerHttpMapper.fromDomainWithBankToResponse(owner, ownerBank),
      city: { id: city.getId(), name: city.getName() },
    };
  }
}
