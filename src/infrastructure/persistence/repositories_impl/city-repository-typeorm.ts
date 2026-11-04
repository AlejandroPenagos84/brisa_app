import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CityRepository } from '@/application/ports/out/repositories/city-repository.js';
import { City } from '@/domain/city.js';
import { CityEntity } from '@/infrastructure/persistence/entities/city.entity.js';
import { CityMapper } from '@/infrastructure/persistence/mapper/city-mapper.js';
import { UUID } from '@/utils/types.js';

@Injectable()
export class CityRepositoryTypeORM implements CityRepository {
  constructor(
    @InjectRepository(CityEntity)
    private readonly repository: Repository<CityEntity>,
  ) {}

  async findByIds(ids: UUID[]): Promise<City[]> {
    if (ids.length === 0) return [];

    const entities = await this.repository.findBy({ id: In(ids) });
    return entities.map((entity) => CityMapper.fromEntityToDomain(entity));
  }

  async findAll(): Promise<City[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => CityMapper.fromEntityToDomain(entity));
  }

  async findById(id: UUID): Promise<City | null> {
    const entity = await this.repository.findOneBy({ id });
    return entity ? CityMapper.fromEntityToDomain(entity) : null;
  }
}
