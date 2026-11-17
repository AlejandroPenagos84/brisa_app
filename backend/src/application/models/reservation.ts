import type { AdministratorTransaction } from '@/domain/administrator-transaction.js';
import type { Client } from '@/domain/client.js';
import type { Rental } from '@/domain/rental.js';

// Result of reserving a property: the rental and the simulated payment
// made from the client's bank account
export interface Reservation {
  rental: Rental;
  payment: AdministratorTransaction;
  client: Client;
}
