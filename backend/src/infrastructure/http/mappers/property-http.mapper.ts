import type { CreatePropertyCommand } from '@/application/commands/create-property.command.js';
import type { PropertyDetails } from '@/application/models/property-details.js';
import type { UpdatePropertyCommand } from '@/application/commands/update-property.command.js';
import { Property } from '@/domain/property.js';
import type { PropertyImage } from '@/domain/property-image.js';
import type { PropertyImageResponse } from '@/infrastructure/http/dto/response/property-image.response.js';
import { propertyImageUrl } from '@/infrastructure/storage/local-disk-property-image-storage.js';
import { CreatePropertyRequest } from '@/infrastructure/http/dto/request/create/create-property.request.js';
import {
  PropertyResponse,
  PropertyDetailsResponse,
} from '@/infrastructure/http/dto/response/property.response.js';
import { UpdatePropertyRequest } from '@/infrastructure/http/dto/request/update/update-property.request.js';
import { OwnerHttpMapper } from './owner-http.mapper.js';

// The API keeps the field "price"; the domain calls it pricePerNight
export class PropertyHttpMapper {
  static fromCreateRequestToCommand(
    request: CreatePropertyRequest,
  ): CreatePropertyCommand {
    return {
      ownerId: request.ownerId,
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
      manuallyInactive: property.isManuallyInactive(),
      images: property
        .getImages()
        .map((image) => this.fromImageToResponse(data.id, image)),
    };
  }

  static fromImageToResponse(
    propertyId: string,
    image: PropertyImage,
  ): PropertyImageResponse {
    return {
      id: image.getId(),
      url: propertyImageUrl(propertyId, image.getFileName()),
      position: image.getPosition(),
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
