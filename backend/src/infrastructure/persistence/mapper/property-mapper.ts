import { Property } from '@/domain/property.js';
import { PropertyEntity } from '@/infrastructure/persistence/entities/property.entity.js';

export class PropertyMapper {
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
    );
  }

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
    entity.pricePerNight = data.price;
    entity.manuallyInactive = property.isManuallyInactive();
    return entity;
  }
}
