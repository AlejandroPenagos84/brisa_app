import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OwnerService } from '@/application/services/owner-service.js';
import {
  OWNER_REPOSITORY,
  type OwnerRepository,
} from '@/application/ports/out/repositories/owner-repository.js';
import { OwnerController } from '@/infrastructure/http/controllers/owner.controller.js';
import { OwnerRepositoryTypeORM } from '@/infrastructure/persistence/repositories_impl/owner-repository-typeorm.js';
import { BankModule } from './bank.module.js';
import { UnitOfWorkModule } from './unit-of-work.module.js';
import {
  BANK_REPOSITORY,
  type BankRepository,
} from '@/application/ports/out/repositories/bank-repository.js';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '@/application/ports/out/repositories/unit-of-work.js';

@Module({
  imports: [BankModule, UnitOfWorkModule],
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
        bankRepository: BankRepository,
        unitOfWork: UnitOfWork,
      ) => new OwnerService(ownerRepository, bankRepository, unitOfWork),
      inject: [OWNER_REPOSITORY, BANK_REPOSITORY, UNIT_OF_WORK],
    },
  ],
  exports: [OWNER_REPOSITORY],
})
export class OwnerModule {}
