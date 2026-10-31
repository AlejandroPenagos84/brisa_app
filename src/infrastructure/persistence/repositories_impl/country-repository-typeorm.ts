import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CountryRepository } from '@/application/ports/out/repositories/country-repository.js';
import { Country } from '@/domain/country.js';
import { CountryEntity } from '@/infrastructure/persistence/entities/country.entity.js';
import { CountryMapper } from '@/infrastructure/persistence/mapper/country-mapper.js';
import { UUID } from '@/utils/types.js';

@Injectable()
export class CountryRepositoryTypeORM implements CountryRepository {
  constructor(
    @InjectRepository(CountryEntity)
    private readonly repository: Repository<CountryEntity>,
  ) {}

  async findAll(): Promise<Country[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => CountryMapper.fromEntityToDomain(entity));
  }

  async findById(id: UUID): Promise<Country | null> {
    const entity = await this.repository.findOneBy({ id });
    return entity ? CountryMapper.fromEntityToDomain(entity) : null;
  }
}
