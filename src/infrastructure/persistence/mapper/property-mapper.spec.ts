import { PropertyMapper } from '@/infrastructure/persistence/mapper/property-mapper.js';
import { PropertyEntity } from '@/infrastructure/persistence/entities/property.entity.js';

describe('PropertyMapper', () => {
  it('round-trips the manual availability', () => {
    const entity = new PropertyEntity();
    entity.id = 'property-1';
    entity.ownerId = 'owner-1';
    entity.cityId = 'city-1';
    entity.address = 'Calle 1';
    entity.area = 60;
    entity.numberOfRooms = 2;
    entity.capacity = 4;
    entity.pricePerNight = 180;
    entity.manuallyInactive = true;

    const property = PropertyMapper.fromEntityToDomain(entity);
    const mapped = PropertyMapper.fromDomainToEntity(property);

    expect(property.isManuallyInactive()).toBe(true);
    expect(mapped.manuallyInactive).toBe(true);
  });
});
