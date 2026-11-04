import { Client } from '@/domain/client.js';
import { UUID } from '@/utils/types.js';

export const CLIENT_REPOSITORY = Symbol('ClientRepository');

export interface ClientRepository {
  findAll(): Promise<Client[]>;
  findByIds(ids: UUID[]): Promise<Client[]>;
  findById(id: UUID): Promise<Client | null>;
  save(client: Client): Promise<Client>;
  update(id: UUID, client: Client): Promise<Client>;
  delete(id: UUID): Promise<boolean>;
}
