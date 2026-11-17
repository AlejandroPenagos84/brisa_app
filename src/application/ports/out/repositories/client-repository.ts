import { Client } from '@/domain/client.js';
import { UUID } from '@/utils/types.js';

export const CLIENT_REPOSITORY = Symbol('ClientRepository');

export interface ClientRepository {
  findAll(): Promise<Client[]>;
  findByIds(ids: UUID[]): Promise<Client[]>;
  findById(id: UUID): Promise<Client | null>;
  // Locks the row until the transaction ends. Only valid inside UnitOfWork.run
  findByIdForUpdate(id: UUID): Promise<Client | null>;
  existsByEmail(email: string, excludeId?: UUID): Promise<boolean>;
  existsByBankAccount(
    bankId: UUID,
    accountNumber: string,
    excludeId?: UUID,
  ): Promise<boolean>;
  save(client: Client): Promise<Client>;
  update(id: UUID, client: Client): Promise<Client>;
  // Deletes the client and its rentals finished before today
  deleteWithFinishedRentals(clientId: UUID, today: Date): Promise<boolean>;
}
