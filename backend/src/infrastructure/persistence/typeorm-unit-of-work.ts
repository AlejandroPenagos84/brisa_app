import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type {
  TransactionalRepositories,
  UnitOfWork,
} from '@/application/ports/out/repositories/unit-of-work.js';
import { AdministratorRepositoryTypeORM } from './repositories_impl/administrator-repository-typeorm.js';
import { AdministratorTransactionRepositoryTypeORM } from './repositories_impl/administrator-transaction-repository-typeorm.js';
import { ClientRepositoryTypeORM } from './repositories_impl/client-repository-typeorm.js';
import { OwnerRepositoryTypeORM } from './repositories_impl/owner-repository-typeorm.js';
import { PropertyRepositoryTypeORM } from './repositories_impl/property-repository-typeorm.js';
import { RentalRepositoryTypeORM } from './repositories_impl/rental-repository-typeorm.js';

// Every repository receives the same transactional EntityManager: if the
// work throws, everything is rolled back.
@Injectable()
export class TypeOrmUnitOfWork implements UnitOfWork {
  constructor(private readonly dataSource: DataSource) {}

  run<T>(work: (repos: TransactionalRepositories) => Promise<T>): Promise<T> {
    return this.dataSource.transaction((manager) =>
      work({
        clientsRepository: new ClientRepositoryTypeORM(manager),
        propertiesRepository: new PropertyRepositoryTypeORM(manager),
        ownersRepository: new OwnerRepositoryTypeORM(manager),
        administratorsRepository: new AdministratorRepositoryTypeORM(manager),
        administratorTransactionsRepository:
          new AdministratorTransactionRepositoryTypeORM(manager),
        rentalsRepository: new RentalRepositoryTypeORM(manager),
      }),
    );
  }
}
