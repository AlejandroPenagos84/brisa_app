import { Property } from '@/domain/property.js';
import { PropertyImage } from '@/domain/property-image.js';
import { PropertyImageEntity } from '@/infrastructure/persistence/entities/property-image.entity.js';
import { PropertyEntity } from '@/infrastructure/persistence/entities/property.entity.js';

export class PropertyMapper {
  // images must be loaded; when the relation is missing it maps to []
  static fromEntityToDomain(entity: PropertyEntity): Property {
    return new Property(
      entity.id,
      entity.ownerId,
      entity.cityId,
      entity.address,
      entity.area,
      entity.numberOfRooms,
      entity.capacity,
      entity.pricePerNight,
      entity.manuallyInactive,
      (entity.images ?? []).map(
        (image) => new PropertyImage(image.id, image.fileName, image.position),
      ),
    );
  }

  // Only the property columns; the images are written by imagesToEntities
  static fromDomainToEntity(property: Property): PropertyEntity {
    const data = property.getData();
    const entity = new PropertyEntity();
    entity.id = data.id;
    entity.ownerId = data.ownerId;
    entity.cityId = data.cityId;
    entity.address = data.address;
    entity.area = data.area;
    entity.numberOfRooms = data.numberOfRooms;
    entity.capacity = data.capacity;
    entity.pricePerNight = data.pricePerNight;
    entity.manuallyInactive = property.isManuallyInactive();
    return entity;
  }

  static imagesToEntities(property: Property): PropertyImageEntity[] {
    return property.getImages().map((image) => {
      const entity = new PropertyImageEntity();
      entity.id = image.getId();
      entity.propertyId = property.getId();
      entity.fileName = image.getFileName();
      entity.position = image.getPosition();
      return entity;
    });
  }
}
