import { Client } from '@/domain/client.js';
import { ClientEntity } from '@/infrastructure/persistence/entities/client.entity.js';

export class ClientMapper {
  static fromEntityToDomain(entity: ClientEntity): Client {
    return new Client(
      entity.id,
      entity.name,
      entity.phone,
      entity.email,
      entity.cityId,
      entity.bankId,
      entity.accountNumber,
      entity.accountType,
      entity.balance,
    );
  }

  static fromDomainToEntity(client: Client): ClientEntity {
    const data = client.getData();
    const entity = new ClientEntity();
    entity.id = data.id;
    entity.name = data.name;
    entity.phone = data.phone;
    entity.email = data.email;
    entity.cityId = data.cityId;
    entity.bankId = data.bankId;
    entity.accountNumber = data.accountNumber;
    entity.accountType = data.accountType;
    entity.balance = data.balance;
    return entity;
  }
}
