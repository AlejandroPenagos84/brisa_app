import { Bank } from '@/domain/bank.js';
import { BankEntity } from '@/infrastructure/persistence/entities/bank.entity.js';

export class BankMapper {
  static fromEntityToDomain(entity: BankEntity): Bank {
    return new Bank(entity.id, entity.name, entity.countryId);
  }

  static fromDomainToEntity(bank: Bank): BankEntity {
    const data = bank.getData();
    const entity = new BankEntity();
    entity.id = data.id;
    entity.name = data.name;
    entity.countryId = data.countryId;
    return entity;
  }
}
