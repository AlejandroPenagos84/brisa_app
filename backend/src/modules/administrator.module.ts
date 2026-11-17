import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  ADMINISTRATOR_REPOSITORY,
  type AdministratorRepository,
} from '@/application/ports/out/repositories/administrator-repository.js';
import {
  ADMINISTRATOR_TRANSACTION_REPOSITORY,
  type AdministratorTransactionRepository,
} from '@/application/ports/out/repositories/administrator-transaction-repository.js';
import {
  BANK_REPOSITORY,
  type BankRepository,
} from '@/application/ports/out/repositories/bank-repository.js';
import { AdministratorService } from '@/application/services/administrator-service.js';
import { UpdateAdministratorUseCase } from '@/application/use-cases/update-administrator.use-case.js';
import { AdministratorController } from '@/infrastructure/http/controllers/administrator.controller.js';
import { AdministratorRepositoryTypeORM } from '@/infrastructure/persistence/repositories_impl/administrator-repository-typeorm.js';
import { AdministratorTransactionRepositoryTypeORM } from '@/infrastructure/persistence/repositories_impl/administrator-transaction-repository-typeorm.js';
import { BankModule } from './bank.module.js';

@Module({
  imports: [BankModule],
  controllers: [AdministratorController],
  providers: [
    {
      provide: ADMINISTRATOR_REPOSITORY,
      useFactory: (dataSource: DataSource) =>
        new AdministratorRepositoryTypeORM(dataSource.manager),
      inject: [DataSource],
    },
    {
      provide: ADMINISTRATOR_TRANSACTION_REPOSITORY,
      useFactory: (dataSource: DataSource) =>
        new AdministratorTransactionRepositoryTypeORM(dataSource.manager),
      inject: [DataSource],
    },
    {
      provide: AdministratorService,
      useFactory: (
        administratorRepository: AdministratorRepository,
        transactionRepository: AdministratorTransactionRepository,
      ) =>
        new AdministratorService(
          administratorRepository,
          transactionRepository,
        ),
      inject: [ADMINISTRATOR_REPOSITORY, ADMINISTRATOR_TRANSACTION_REPOSITORY],
    },
    {
      provide: UpdateAdministratorUseCase,
      useFactory: (
        administratorRepository: AdministratorRepository,
        bankRepository: BankRepository,
      ) =>
        new UpdateAdministratorUseCase(administratorRepository, bankRepository),
      inject: [ADMINISTRATOR_REPOSITORY, BANK_REPOSITORY],
    },
  ],
  exports: [ADMINISTRATOR_REPOSITORY, ADMINISTRATOR_TRANSACTION_REPOSITORY],
})
export class AdministratorModule {}
