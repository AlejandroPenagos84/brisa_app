import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  BANK_REPOSITORY,
  type BankRepository,
} from '@/application/ports/out/repositories/bank-repository.js';
import { BankService } from '@/application/services/bank-service.js';
import { BankController } from '@/infrastructure/http/controllers/bank.controller.js';
import { BankRepositoryTypeORM } from '@/infrastructure/persistence/repositories_impl/bank-repository-typeorm.js';
import { CountryModule } from './country.module.js';
import {
  COUNTRY_REPOSITORY,
  type CountryRepository,
} from '@/application/ports/out/repositories/country-repository.js';

@Module({
  imports: [CountryModule],
  controllers: [BankController],
  providers: [
    {
      provide: BANK_REPOSITORY,
      useFactory: (dataSource: DataSource) =>
        new BankRepositoryTypeORM(dataSource.manager),
      inject: [DataSource],
    },
    {
      provide: BankService,
      useFactory: (
        bankRepository: BankRepository,
        countryRepository: CountryRepository,
      ) => new BankService(bankRepository, countryRepository),
      inject: [BANK_REPOSITORY, COUNTRY_REPOSITORY],
    },
  ],
  exports: [BANK_REPOSITORY, BankService],
})
export class BankModule {}
