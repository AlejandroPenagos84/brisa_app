import { AdministratorTransaction } from '@/domain/administrator-transaction.js';
import { AdministratorTransactionEntity } from '@/infrastructure/persistence/entities/administrator-transaction.entity.js';

export class AdministratorTransactionMapper {
  static fromEntityToDomain(
    entity: AdministratorTransactionEntity,
  ): AdministratorTransaction {
    return new AdministratorTransaction(
      entity.id,
      entity.administratorId,
      entity.ownerId,
      entity.type,
      entity.grossAmount,
      entity.commission,
      entity.netAmount,
      entity.createdAt,
    );
  }

  static fromDomainToEntity(
    transaction: AdministratorTransaction,
  ): AdministratorTransactionEntity {
    const data = transaction.getData();
    const entity = new AdministratorTransactionEntity();
    entity.id = data.id;
    entity.administratorId = data.administratorId;
    entity.ownerId = data.ownerId;
    entity.type = data.type;
    entity.grossAmount = data.grossAmount;
    entity.commission = data.commission;
    entity.netAmount = data.netAmount;
    entity.createdAt = data.createdAt;
    return entity;
  }
}
