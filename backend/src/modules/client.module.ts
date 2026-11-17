import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  CLIENT_REPOSITORY,
  type ClientRepository,
} from '@/application/ports/out/repositories/client-repository.js';
import { ClientService } from '@/application/services/client-service.js';
import { ClientController } from '@/infrastructure/http/controllers/client.controller.js';
import { ClientRepositoryTypeORM } from '@/infrastructure/persistence/repositories_impl/client-repository-typeorm.js';
import { CityModule } from './city.module.js';
import { BankModule } from './bank.module.js';
import { CountryModule } from './country.module.js';
import { UnitOfWorkModule } from './unit-of-work.module.js';
import {
  CITY_REPOSITORY,
  type CityRepository,
} from '@/application/ports/out/repositories/city-repository.js';
import {
  BANK_REPOSITORY,
  type BankRepository,
} from '@/application/ports/out/repositories/bank-repository.js';
import {
  COUNTRY_REPOSITORY,
  type CountryRepository,
} from '@/application/ports/out/repositories/country-repository.js';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '@/application/ports/out/repositories/unit-of-work.js';

@Module({
  imports: [CityModule, BankModule, CountryModule, UnitOfWorkModule],
  controllers: [ClientController],
  providers: [
    {
      provide: CLIENT_REPOSITORY,
      useFactory: (dataSource: DataSource) =>
        new ClientRepositoryTypeORM(dataSource.manager),
      inject: [DataSource],
    },
    {
      provide: ClientService,
      useFactory: (
        clientRepository: ClientRepository,
        cityRepository: CityRepository,
        bankRepository: BankRepository,
        countryRepository: CountryRepository,
        unitOfWork: UnitOfWork,
      ) =>
        new ClientService(
          clientRepository,
          cityRepository,
          bankRepository,
          countryRepository,
          unitOfWork,
        ),
      inject: [
        CLIENT_REPOSITORY,
        CITY_REPOSITORY,
        BANK_REPOSITORY,
        COUNTRY_REPOSITORY,
        UNIT_OF_WORK,
      ],
    },
  ],
  exports: [CLIENT_REPOSITORY, ClientService],
})
export class ClientModule {}
