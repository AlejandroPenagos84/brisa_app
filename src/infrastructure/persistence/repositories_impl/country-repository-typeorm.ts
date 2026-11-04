import { EntityManager, In, Repository } from 'typeorm';
import { CountryRepository } from '@/application/ports/out/repositories/country-repository.js';
import { Country } from '@/domain/country.js';
import { CountryEntity } from '@/infrastructure/persistence/entities/country.entity.js';
import { CountryMapper } from '@/infrastructure/persistence/mapper/country-mapper.js';
import { UUID } from '@/utils/types.js';

export class CountryRepositoryTypeORM implements CountryRepository {
  private readonly repository: Repository<CountryEntity>;

  constructor(private readonly manager: EntityManager) {
    this.repository = manager.getRepository(CountryEntity);
  }

  async findByIds(ids: UUID[]): Promise<Country[]> {
    if (ids.length === 0) return [];

    const entities = await this.repository.findBy({ id: In(ids) });
    return entities.map((entity) => CountryMapper.fromEntityToDomain(entity));
  }

  async findAll(): Promise<Country[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => CountryMapper.fromEntityToDomain(entity));
  }

  async findById(id: UUID): Promise<Country | null> {
    const entity = await this.repository.findOneBy({ id });
    return entity ? CountryMapper.fromEntityToDomain(entity) : null;
  }
}
