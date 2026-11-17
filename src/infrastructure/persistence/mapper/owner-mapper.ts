import { Owner } from '@/domain/owner.js';
import { OwnerEntity } from '@/infrastructure/persistence/entities/owner.entity.js';

export class OwnerMapper {
  static fromEntityToDomain(entity: OwnerEntity): Owner {
    return new Owner(
      entity.id,
      entity.name,
      entity.phone,
      entity.email,
      entity.bankId,
      entity.accountNumber,
      entity.accountType,
      entity.balance,
    );
  }

  static fromDomainToEntity(owner: Owner): OwnerEntity {
    const data = owner.getData();
    const entity = new OwnerEntity();
    entity.id = data.id;
    entity.name = data.name;
    entity.phone = data.phone;
    entity.email = data.email;
    entity.bankId = data.bankId;
    entity.accountNumber = data.accountNumber;
    entity.accountType = data.accountType;
    entity.balance = data.balance;
    return entity;
  }
}
