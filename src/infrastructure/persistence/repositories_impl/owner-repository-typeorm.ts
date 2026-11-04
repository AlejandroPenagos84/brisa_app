import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { OwnerRepository } from '@/application/ports/out/repositories/owner-repository.js';
import { Owner } from '@/domain/owner.js';
import { OwnerEntity } from '@/infrastructure/persistence/entities/owner.entity.js';
import { OwnerMapper } from '@/infrastructure/persistence/mapper/owner-mapper.js';
import { UUID } from '@/utils/types.js';

@Injectable()
export class OwnerRepositoryTypeORM implements OwnerRepository {
  constructor(
    @InjectRepository(OwnerEntity)
    private readonly repository: Repository<OwnerEntity>,
  ) {}

  async findByIds(ids: UUID[]): Promise<Owner[]> {
    if (ids.length === 0) return [];

    const entities = await this.repository.findBy({ id: In(ids) });
    return entities.map((entity) => OwnerMapper.fromEntityToDomain(entity));
  }

  async findAll(): Promise<Owner[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => OwnerMapper.fromEntityToDomain(entity));
  }

  async findById(id: UUID): Promise<Owner | null> {
    const entity = await this.repository.findOneBy({ id });
    return entity ? OwnerMapper.fromEntityToDomain(entity) : null;
  }

  // insert() fails if the id already exists; save() would overwrite it
  async save(owner: Owner): Promise<Owner> {
    await this.repository.insert(OwnerMapper.fromDomainToEntity(owner));
    return owner;
  }

  async update(id: UUID, owner: Owner): Promise<Owner> {
    if (owner.getData().id !== id) {
      throw new Error('The owner id does not match');
    }

    const exists = await this.repository.existsBy({ id });
    if (!exists) {
      throw new Error(`Owner with id ${id} not found`);
    }

    const saved = await this.repository.save(
      OwnerMapper.fromDomainToEntity(owner),
    );
    return OwnerMapper.fromEntityToDomain(saved);
  }

  async delete(id: UUID): Promise<boolean> {
    const result = await this.repository.delete({ id });
    return (result.affected ?? 0) > 0;
  }
}
