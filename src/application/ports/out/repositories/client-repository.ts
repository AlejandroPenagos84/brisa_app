import { Client } from '@/domain/client.js';
import { UUID } from '@/utils/types.js';

export interface ClientRepository {
  findAll(): Promise<Client[]>;
  findById(id: UUID): Promise<Client | null>;
  save(client: Client): Promise<Client>;
  update(id: UUID, client: Client): Promise<Client>;
  delete(id: UUID): Promise<boolean>;
  deposit(id: UUID, amount: number): Promise<Client>;
  discount(id: UUID, amount: number): Promise<Client>;
}
