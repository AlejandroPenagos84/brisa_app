import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';
import { ClientRepository } from '@/application/ports/out/repositories/client-repository.js';
import { Client } from '@/domain/client.js';
import { ClientEntity } from '@/infrastructure/persistence/entities/client.entity.js';
import { RentalEntity } from '@/infrastructure/persistence/entities/rental.entity.js';
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

  async existsByEmail(email: string, excludeId?: UUID): Promise<boolean> {
    const query = this.repository
      .createQueryBuilder('client')
      .where('LOWER(client.email) = LOWER(:email)', { email });

    if (excludeId !== undefined) {
      query.andWhere('client.id != :excludeId', { excludeId });
    }

    const count = await query.getCount();
    return count > 0;
  }

  async existsByBankAccount(
    bankId: UUID,
    accountNumber: string,
    excludeId?: UUID,
  ): Promise<boolean> {
    const query = this.repository
      .createQueryBuilder('client')
      .where('client.bankId = :bankId', { bankId })
      .andWhere('client.accountNumber = :accountNumber', { accountNumber });

    if (excludeId !== undefined) {
      query.andWhere('client.id != :excludeId', { excludeId });
    }

    const count = await query.getCount();
    return count > 0;
  }

  async hasActiveRentals(clientId: UUID): Promise<boolean> {
    const today = new Date().toISOString().slice(0, 10);
    const count = await this.repository
      .createQueryBuilder('client')
      .innerJoin('client.rentals', 'rental')
      .where('client.id = :clientId', { clientId })
      .andWhere('rental.checkOutDate >= :today', { today })
      .getCount();

    return count > 0;
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

  async deleteWithFinishedRentals(clientId: UUID): Promise<boolean> {
    const today = new Date().toISOString().slice(0, 10);

    return this.repository.manager.transaction(async (manager) => {
      await manager.delete(RentalEntity, {
        clientId,
        checkOutDate: LessThan(today),
      });

      const result = await manager.delete(ClientEntity, { id: clientId });
      return (result.affected ?? 0) > 0;
    });
  }
}
