import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ClientRepository } from '@/application/ports/out/repositories/client-repository.js';
import { Client } from '@/domain/client.js';
import { ClientEntity } from '@/infrastructure/persistence/entities/client.entity.js';
import { ClientMapper } from '@/infrastructure/persistence/mapper/client-mapper.js';
import { UUID } from '@/utils/types.js';

@Injectable()
export class ClientRepositoryTypeORM implements ClientRepository {
  constructor(
    @InjectRepository(ClientEntity)
    private readonly repository: Repository<ClientEntity>,
  ) {}

  async findByIds(ids: UUID[]): Promise<Client[]> {
    if (ids.length === 0) return [];

    const entities = await this.repository.findBy({ id: In(ids) });
    return entities.map((entity) => ClientMapper.fromEntityToDomain(entity));
  }

  async findAll(): Promise<Client[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => ClientMapper.fromEntityToDomain(entity));
  }

  async findById(id: UUID): Promise<Client | null> {
    const entity = await this.repository.findOneBy({ id });
    return entity ? ClientMapper.fromEntityToDomain(entity) : null;
  }

  // insert() fails if the id already exists; save() would overwrite it
  async save(client: Client): Promise<Client> {
    await this.repository.insert(ClientMapper.fromDomainToEntity(client));
    return client;
  }

  async update(id: UUID, client: Client): Promise<Client> {
    if (client.getData().id !== id) {
      throw new Error('The client id does not match');
    }

    const exists = await this.repository.existsBy({ id });
    if (!exists) {
      throw new Error(`Client with id ${id} not found`);
    }

    const saved = await this.repository.save(
      ClientMapper.fromDomainToEntity(client),
    );
    return ClientMapper.fromEntityToDomain(saved);
  }

  async delete(id: UUID): Promise<boolean> {
    const result = await this.repository.delete({ id });
    return (result.affected ?? 0) > 0;
  }
}
