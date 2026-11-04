import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CITY_REPOSITORY } from '@/application/ports/out/repositories/city-repository.js';
import { CityService } from '@/application/services/city-service.js';
import { CityController } from '@/infrastructure/http/controllers/city.controller.js';
import { CityEntity } from '@/infrastructure/persistence/entities/city.entity.js';
import { CityRepositoryTypeORM } from '@/infrastructure/persistence/repositories_impl/city-repository-typeorm.js';
import { CountryModule } from './country.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([CityEntity]), CountryModule],
  controllers: [CityController],
  providers: [
    { provide: CITY_REPOSITORY, useClass: CityRepositoryTypeORM },
    CityService,
  ],
  exports: [CITY_REPOSITORY, CityService],
})
export class CityModule {}
