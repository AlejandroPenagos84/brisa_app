import { Administrator } from '@/domain/administrator.js';
import { AdministratorEntity } from '@/infrastructure/persistence/entities/administrator.entity.js';

export class AdministratorMapper {
  static fromEntityToDomain(entity: AdministratorEntity): Administrator {
    return new Administrator(
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

  static fromDomainToEntity(administrator: Administrator): AdministratorEntity {
    const data = administrator.getData();
    const entity = new AdministratorEntity();
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
