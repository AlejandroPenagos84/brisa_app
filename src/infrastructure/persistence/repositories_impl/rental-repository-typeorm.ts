import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RentalRepository } from '@/application/ports/out/repositories/rental-repository.js';
import { Rental, RentalKey } from '@/domain/rental.js';
import { RentalEntity } from '@/infrastructure/persistence/entities/rental.entity.js';
import { RentalMapper } from '@/infrastructure/persistence/mapper/rental-mapper.js';

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

  async findByKey(key: RentalKey): Promise<Rental | null> {
    const entity = await this.repository.findOneBy(
      RentalMapper.fromKeyToEntityKey(key),
    );
    return entity ? RentalMapper.fromEntityToDomain(entity) : null;
  }

  // insert() fails if the key already exists; save() would overwrite it
  async save(rental: Rental): Promise<Rental> {
    await this.repository.insert(RentalMapper.fromDomainToEntity(rental));
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
      throw new Error('Rental not found');
    }

    const saved = await this.repository.save(
      RentalMapper.fromDomainToEntity(rental),
    );
    return RentalMapper.fromEntityToDomain(saved);
  }

  async delete(key: RentalKey): Promise<boolean> {
    const result = await this.repository.delete(
      RentalMapper.fromKeyToEntityKey(key),
    );
    return (result.affected ?? 0) > 0;
  }
}
