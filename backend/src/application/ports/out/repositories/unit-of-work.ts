import type { AdministratorRepository } from './administrator-repository.js';
import type { AdministratorTransactionRepository } from './administrator-transaction-repository.js';
import type { ClientRepository } from './client-repository.js';
import type { OwnerRepository } from './owner-repository.js';
import type { PropertyRepository } from './property-repository.js';
import type { RentalRepository } from './rental-repository.js';

export const UNIT_OF_WORK = Symbol('UnitOfWork');

// Every repository works on the same transaction.
// Lock order, always the same to avoid deadlocks:
//   client → property → owner → administrator
export interface TransactionalRepositories {
  clientsRepository: ClientRepository;
  propertiesRepository: PropertyRepository;
  ownersRepository: OwnerRepository;
  administratorsRepository: AdministratorRepository;
  administratorTransactionsRepository: AdministratorTransactionRepository;
  rentalsRepository: RentalRepository;
}

export interface UnitOfWork {
  run<T>(work: (repos: TransactionalRepositories) => Promise<T>): Promise<T>;
}
