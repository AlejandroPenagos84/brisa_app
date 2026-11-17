import { NotFoundError } from '@/application/errors/application-error.js';
import { EntityManager, In, Repository } from 'typeorm';
import { OwnerRepository } from '@/application/ports/out/repositories/owner-repository.js';
import { Owner } from '@/domain/owner.js';
import { OwnerEntity } from '@/infrastructure/persistence/entities/owner.entity.js';
import { OwnerMapper } from '@/infrastructure/persistence/mapper/owner-mapper.js';
import { UUID } from '@/utils/types.js';

export class OwnerRepositoryTypeORM implements OwnerRepository {
  private readonly repository: Repository<OwnerEntity>;

  constructor(private readonly manager: EntityManager) {
    this.repository = manager.getRepository(OwnerEntity);
  }

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

  async findByIdForUpdate(id: UUID): Promise<Owner | null> {
    const entity = await this.repository.findOne({
      where: { id },
      lock: { mode: 'pessimistic_write' }, // SELECT ... FOR UPDATE
    });
    return entity ? OwnerMapper.fromEntityToDomain(entity) : null;
  }

  async existsByEmail(email: string, excludeId?: UUID): Promise<boolean> {
    const query = this.repository
      .createQueryBuilder('owner')
      .where('LOWER(owner.email) = LOWER(:email)', { email });

    if (excludeId !== undefined) {
      query.andWhere('owner.id != :excludeId', { excludeId });
    }

    const count = await query.getCount();
    return count > 0;
  }

  async hasProperties(ownerId: UUID): Promise<boolean> {
    const count = await this.repository
      .createQueryBuilder('owner')
      .innerJoin('owner.properties', 'property')
      .where('owner.id = :ownerId', { ownerId })
      .getCount();

    return count > 0;
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
      throw new NotFoundError(`Owner with id ${id} not found`);
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
