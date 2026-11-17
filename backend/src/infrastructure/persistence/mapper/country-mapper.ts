import { Country } from '@/domain/country.js';
import { CountryEntity } from '@/infrastructure/persistence/entities/country.entity.js';

export class CountryMapper {
  static fromEntityToDomain(entity: CountryEntity): Country {
    return new Country(entity.id, entity.name);
  }

  static fromDomainToEntity(country: Country): CountryEntity {
    const data = country.getData();
    const entity = new CountryEntity();
    entity.id = data.id;
    entity.name = data.name;
    return entity;
  }
}
