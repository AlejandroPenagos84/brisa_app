import {
  COUNTRY_REPOSITORY,
  type CountryRepository,
} from '@/application/ports/out/repositories/country-repository.js';
import { CountryService } from '@/application/services/country-service.js';
import { CountryController } from '@/infrastructure/http/controllers/country.controller.js';
import { CountryRepositoryTypeORM } from '@/infrastructure/persistence/repositories_impl/country-repository-typeorm.js';
import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Module({
  controllers: [CountryController],
  providers: [
    {
      provide: COUNTRY_REPOSITORY,
      useFactory: (dataSource: DataSource) =>
        new CountryRepositoryTypeORM(dataSource.manager),
      inject: [DataSource],
    },
    {
      provide: CountryService,
      useFactory: (countryRepository: CountryRepository) =>
        new CountryService(countryRepository),
      inject: [COUNTRY_REPOSITORY],
    },
  ], // Proveedor que implementa la interfaz de repositorio de paises
  exports: [COUNTRY_REPOSITORY, CountryService], // Exportacion del proveedor y del servicio de paises
})
export class CountryModule {}
