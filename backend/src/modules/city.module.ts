import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  CITY_REPOSITORY,
  type CityRepository,
} from '@/application/ports/out/repositories/city-repository.js';
import { CityService } from '@/application/services/city-service.js';
import { CityController } from '@/infrastructure/http/controllers/city.controller.js';
import { CityRepositoryTypeORM } from '@/infrastructure/persistence/repositories_impl/city-repository-typeorm.js';
import { CountryModule } from './country.module.js';
import {
  COUNTRY_REPOSITORY,
  type CountryRepository,
} from '@/application/ports/out/repositories/country-repository.js';

@Module({
  imports: [CountryModule],
  controllers: [CityController],
  providers: [
    {
      provide: CITY_REPOSITORY,
      useFactory: (dataSource: DataSource) =>
        new CityRepositoryTypeORM(dataSource.manager),
      inject: [DataSource],
    },
    {
      provide: CityService,
      useFactory: (
        cityRepository: CityRepository,
        countryRepository: CountryRepository,
      ) => new CityService(cityRepository, countryRepository),
      inject: [CITY_REPOSITORY, COUNTRY_REPOSITORY],
    },
  ],
  exports: [CITY_REPOSITORY, CityService],
})
export class CityModule {}
