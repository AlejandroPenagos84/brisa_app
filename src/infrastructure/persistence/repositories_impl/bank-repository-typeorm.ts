import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BankRepository } from '@/application/ports/out/repositories/bank-repository.js';
import { Bank } from '@/domain/bank.js';
import { BankEntity } from '@/infrastructure/persistence/entities/bank.entity.js';
import { BankMapper } from '@/infrastructure/persistence/mapper/bank-mapper.js';
import { UUID } from '@/utils/types.js';

@Injectable()
export class BankRepositoryTypeORM implements BankRepository {
  constructor(
    @InjectRepository(BankEntity)
    private readonly repository: Repository<BankEntity>,
  ) {}

  async findByIds(ids: UUID[]): Promise<Bank[]> {
    if (ids.length === 0) return [];

    const entities = await this.repository.findBy({ id: In(ids) });
    return entities.map((entity) => BankMapper.fromEntityToDomain(entity));
  }

  async findAll(): Promise<Bank[]> {
    const entities = await this.repository.find();
    return entities.map((entity) => BankMapper.fromEntityToDomain(entity));
  }

  async findById(id: UUID): Promise<Bank | null> {
    const entity = await this.repository.findOneBy({ id });
    return entity ? BankMapper.fromEntityToDomain(entity) : null;
  }
}
