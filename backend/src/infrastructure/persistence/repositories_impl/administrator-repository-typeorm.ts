import { EntityManager, Repository } from 'typeorm';
import type { AdministratorRepository } from '@/application/ports/out/repositories/administrator-repository.js';
import { Administrator } from '@/domain/administrator.js';
import { AdministratorEntity } from '@/infrastructure/persistence/entities/administrator.entity.js';
import { AdministratorMapper } from '@/infrastructure/persistence/mapper/administrator-mapper.js';

export class AdministratorRepositoryTypeORM implements AdministratorRepository {
  private readonly repository: Repository<AdministratorEntity>;

  constructor(private readonly manager: EntityManager) {
    this.repository = manager.getRepository(AdministratorEntity);
  }

  async getAdministrator(): Promise<Administrator> {
    const entity = await this.repository
      .createQueryBuilder('administrator')
      .limit(1)
      .getOne();
    return AdministratorRepositoryTypeORM.toDomainOrThrow(entity);
  }

  async getAdministratorForUpdate(): Promise<Administrator> {
    const entity = await this.repository
      .createQueryBuilder('administrator')
      .setLock('pessimistic_write') // SELECT ... FOR UPDATE
      .limit(1)
      .getOne();
    return AdministratorRepositoryTypeORM.toDomainOrThrow(entity);
  }

  async update(administrator: Administrator): Promise<Administrator> {
    const id = administrator.getId();
    const exists = await this.repository.existsBy({ id });
    if (!exists) {
      throw new Error(`Administrator with id ${id} does not exist`);
    }

    const saved = await this.repository.save(
      AdministratorMapper.fromDomainToEntity(administrator),
    );
    return AdministratorMapper.fromEntityToDomain(saved);
  }

  // Missing administrator = script.sql was not run: a 500, not a 404
  private static toDomainOrThrow(
    entity: AdministratorEntity | null,
  ): Administrator {
    if (!entity) {
      throw new Error('The administrator does not exist. Run script.sql');
    }
    return AdministratorMapper.fromEntityToDomain(entity);
  }
}
