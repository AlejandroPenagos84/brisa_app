import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CLOCK, type Clock } from '@/application/ports/out/clock.js';
import {
  ADMINISTRATOR_TRANSACTION_REPOSITORY,
  type AdministratorTransactionRepository,
} from '@/application/ports/out/repositories/administrator-transaction-repository.js';
import {
  BANK_REPOSITORY,
  type BankRepository,
} from '@/application/ports/out/repositories/bank-repository.js';
import {
  OWNER_REPOSITORY,
  type OwnerRepository,
} from '@/application/ports/out/repositories/owner-repository.js';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '@/application/ports/out/repositories/unit-of-work.js';
import { OwnerService } from '@/application/services/owner-service.js';
import { CreateOwnerUseCase } from '@/application/use-cases/create-owner.use-case.js';
import { DeleteOwnerUseCase } from '@/application/use-cases/delete-owner.use-case.js';
import { UpdateOwnerUseCase } from '@/application/use-cases/update-owner.use-case.js';
import { OwnerController } from '@/infrastructure/http/controllers/owner.controller.js';
import { OwnerRepositoryTypeORM } from '@/infrastructure/persistence/repositories_impl/owner-repository-typeorm.js';
import { AdministratorModule } from './administrator.module.js';
import { BankModule } from './bank.module.js';
import { ClockModule } from './clock.module.js';
import { UnitOfWorkModule } from './unit-of-work.module.js';

@Module({
  imports: [BankModule, AdministratorModule, ClockModule, UnitOfWorkModule],
  controllers: [OwnerController],
  providers: [
    {
      provide: OWNER_REPOSITORY,
      useFactory: (dataSource: DataSource) =>
        new OwnerRepositoryTypeORM(dataSource.manager),
      inject: [DataSource],
    },
    {
      provide: OwnerService,
      useFactory: (
        ownerRepository: OwnerRepository,
        transactionRepository: AdministratorTransactionRepository,
      ) => new OwnerService(ownerRepository, transactionRepository),
      inject: [OWNER_REPOSITORY, ADMINISTRATOR_TRANSACTION_REPOSITORY],
    },
    {
      provide: CreateOwnerUseCase,
      useFactory: (
        ownerRepository: OwnerRepository,
        bankRepository: BankRepository,
      ) => new CreateOwnerUseCase(ownerRepository, bankRepository),
      inject: [OWNER_REPOSITORY, BANK_REPOSITORY],
    },
    {
      provide: UpdateOwnerUseCase,
      useFactory: (
        unitOfWork: UnitOfWork,
        bankRepository: BankRepository,
      ) => new UpdateOwnerUseCase(unitOfWork, bankRepository),
      inject: [UNIT_OF_WORK, BANK_REPOSITORY],
    },
    {
      provide: DeleteOwnerUseCase,
      useFactory: (unitOfWork: UnitOfWork, clock: Clock) =>
        new DeleteOwnerUseCase(unitOfWork, clock),
      inject: [UNIT_OF_WORK, CLOCK],
    },
  ],
  exports: [OWNER_REPOSITORY],
})
export class OwnerModule {}
