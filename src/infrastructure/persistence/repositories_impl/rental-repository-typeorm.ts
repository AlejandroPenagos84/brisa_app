import { businessToday } from '@/utils/business-date.js';
import { NotFoundError } from '@/application/errors/application-error.js';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RentalRepository } from '@/application/ports/out/repositories/rental-repository.js';
import { Client } from '@/domain/client.js';
import { Rental, RentalKey } from '@/domain/rental.js';
import { ClientEntity } from '@/infrastructure/persistence/entities/client.entity.js';
import { RentalEntity } from '@/infrastructure/persistence/entities/rental.entity.js';
import { ClientMapper } from '@/infrastructure/persistence/mapper/client-mapper.js';
import { RentalMapper } from '@/infrastructure/persistence/mapper/rental-mapper.js';
import { UUID } from '@/utils/types.js';

@Injectable()
export class RentalRepositoryTypeORM implements RentalRepository {
  constructor(
    @InjectRepository(RentalEntity)
    private readonly repository: Repository<RentalEntity>,
  ) {}

  async findAll(): Promise<Rental[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => RentalMapper.fromEntityToDomain(entity));
  }

  async findByKeys(keys: RentalKey[]): Promise<Rental[]> {
    if (keys.length === 0) return [];

    const entities = await this.repository.findBy(
      keys.map((key) => RentalMapper.fromKeyToEntityKey(key)),
    );
    return entities.map((entity) => RentalMapper.fromEntityToDomain(entity));
  }

  async findByClientId(clientId: UUID): Promise<Rental[]> {
    const entities = await this.repository.findBy({ clientId });
    return entities.map((entity) => RentalMapper.fromEntityToDomain(entity));
  }

  async findByKey(key: RentalKey): Promise<Rental | null> {
    const entity = await this.repository.findOneBy(
      RentalMapper.fromKeyToEntityKey(key),
    );
    return entity ? RentalMapper.fromEntityToDomain(entity) : null;
  }

  async hasOverlappingPropertyRental(
    propertyId: UUID,
    startDate: Date,
    endDate: Date,
  ): Promise<boolean> {
    const today = businessToday();
    const count = await this.repository
      .createQueryBuilder('rental')
      .where('rental.propertyId = :propertyId', { propertyId })
      .andWhere('rental.checkInDate <= :endDate', {
        endDate: RentalMapper.toDateColumn(endDate),
      })
      .andWhere('rental.checkOutDate >= :startDate', {
        startDate: RentalMapper.toDateColumn(startDate),
      })
      .andWhere('rental.checkOutDate >= :today', { today })
      .getCount();

    return count > 0;
  }

  async hasOverlappingClientRental(
    clientId: UUID,
    startDate: Date,
    endDate: Date,
  ): Promise<boolean> {
    const today = businessToday();
    const count = await this.repository
      .createQueryBuilder('rental')
      .where('rental.clientId = :clientId', { clientId })
      .andWhere('rental.checkInDate <= :endDate', {
        endDate: RentalMapper.toDateColumn(endDate),
      })
      .andWhere('rental.checkOutDate >= :startDate', {
        startDate: RentalMapper.toDateColumn(startDate),
      })
      .andWhere('rental.checkOutDate >= :today', { today })
      .getCount();

    return count > 0;
  }

  async updateStatuses(rentals: Rental[]): Promise<void> {
    if (rentals.length === 0) return;

    await this.repository.manager.transaction(async (manager) => {
      for (const rental of rentals) {
        await manager.update(
          RentalEntity,
          RentalMapper.fromKeyToEntityKey(rental.getKey()),
          { status: rental.getStatus() },
        );
      }
    });
  }

  // insert() fails if the key already exists; save() would overwrite it.
  // The rental and the charged client are persisted in the same transaction.
  async saveWithClient(rental: Rental, client: Client): Promise<Rental> {
    await this.repository.manager.transaction(async (manager) => {
      await manager.insert(
        RentalEntity,
        RentalMapper.fromDomainToEntity(rental),
      );
      await manager.save(
        ClientEntity,
        ClientMapper.fromDomainToEntity(client),
      );
    });

    return rental;
  }

  // The key columns are the primary key, so only the other columns change.
  // Changing the property, client or start date means deleting and creating.
  async update(key: RentalKey, rental: Rental): Promise<Rental> {
    const entityKey = RentalMapper.fromKeyToEntityKey(key);
    const newKey = RentalMapper.fromKeyToEntityKey(rental.getKey());
    if (
      entityKey.propertyId !== newKey.propertyId ||
      entityKey.clientId !== newKey.clientId ||
      entityKey.checkInDate !== newKey.checkInDate
    ) {
      throw new Error('The rental key does not match');
    }

    const exists = await this.repository.existsBy(entityKey);
    if (!exists) {
      throw new NotFoundError('Rental not found');
    }

    const saved = await this.repository.save(
      RentalMapper.fromDomainToEntity(rental),
    );
    return RentalMapper.fromEntityToDomain(saved);
  }

  // The rental is deleted and the refunded client saved in one transaction.
  async deleteWithClient(key: RentalKey, client: Client): Promise<boolean> {
    return this.repository.manager.transaction(async (manager) => {
      const result = await manager.delete(
        RentalEntity,
        RentalMapper.fromKeyToEntityKey(key),
      );

      if ((result.affected ?? 0) === 0) {
        throw new NotFoundError('Rental not found');
      }

      await manager.save(
        ClientEntity,
        ClientMapper.fromDomainToEntity(client),
      );

      return true;
    });
  }
}
