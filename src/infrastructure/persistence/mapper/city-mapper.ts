import { City } from '@/domain/city.js';
import { CityEntity } from '@/infrastructure/persistence/entities/city.entity.js';

export class CityMapper {
  static fromEntityToDomain(entity: CityEntity): City {
    return new City(entity.id, entity.name, entity.countryId);
  }

  static fromDomainToEntity(city: City): CityEntity {
    const data = city.getData();
    const entity = new CityEntity();
    entity.id = data.id;
    entity.name = data.name;
    entity.countryId = data.countryId;
    return entity;
  }
}
