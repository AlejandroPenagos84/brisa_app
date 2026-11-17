import { EntityManager, Repository } from 'typeorm';
import type { AdministratorTransactionRepository } from '@/application/ports/out/repositories/administrator-transaction-repository.js';
import {
  AdministratorTransaction,
  TransactionType,
} from '@/domain/administrator-transaction.js';
import { AdministratorTransactionEntity } from '@/infrastructure/persistence/entities/administrator-transaction.entity.js';
import { AdministratorTransactionMapper } from '@/infrastructure/persistence/mapper/administrator-transaction-mapper.js';
import type { UUID } from '@/utils/types.js';

export class AdministratorTransactionRepositoryTypeORM implements AdministratorTransactionRepository {
  private readonly repository: Repository<AdministratorTransactionEntity>;

  constructor(private readonly manager: EntityManager) {
    this.repository = manager.getRepository(AdministratorTransactionEntity);
  }

  async findAll(): Promise<AdministratorTransaction[]> {
    const entities = await this.repository.find({
      order: { createdAt: 'DESC', id: 'ASC' },
    });
    return entities.map((entity) =>
      AdministratorTransactionMapper.fromEntityToDomain(entity),
    );
  }

  async findByOwnerId(ownerId: UUID): Promise<AdministratorTransaction[]> {
    const entities = await this.repository.find({
      where: { ownerId },
      order: { createdAt: 'DESC', id: 'ASC' },
    });
    return entities.map((entity) =>
      AdministratorTransactionMapper.fromEntityToDomain(entity),
    );
  }

  // Summed by PostgreSQL (NUMERIC, exact); it arrives as a string
  async sumNetByOwnerId(ownerId: UUID): Promise<number> {
    const row = await this.repository
      .createQueryBuilder('tx')
      .select(
        `COALESCE(SUM(CASE WHEN tx.type = :payment
           THEN tx.net_amount
           ELSE -tx.net_amount END), 0)`,
        'total',
      )
      .where('tx.owner_id = :ownerId', { ownerId })
      .setParameter('payment', TransactionType.PAYMENT)
      .getRawOne<{ total: string }>();

    return Number(row?.total ?? 0);
  }

  // insert() fails if the id already exists: transactions are never
  // overwritten
  async save(
    transaction: AdministratorTransaction,
  ): Promise<AdministratorTransaction> {
    await this.repository.insert(
      AdministratorTransactionMapper.fromDomainToEntity(transaction),
    );
    return transaction;
  }

  async deleteByOwnerId(ownerId: UUID): Promise<void> {
    await this.repository.delete({ ownerId });
  }
}
