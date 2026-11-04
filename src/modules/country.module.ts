import { COUNTRY_REPOSITORY } from '@/application/ports/out/repositories/country-repository.js';
import { CountryService } from '@/application/services/country-service.js';
import { CountryController } from '@/infrastructure/http/controllers/country.controller.js';
import { CountryEntity } from '@/infrastructure/persistence/entities/country.entity.js';
import { CountryRepositoryTypeORM } from '@/infrastructure/persistence/repositories_impl/country-repository-typeorm.js';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([CountryEntity])], // Importacion de otros modulos necesarios
  controllers: [CountryController],
  providers: [
    { provide: COUNTRY_REPOSITORY, useClass: CountryRepositoryTypeORM },
    CountryService,
  ], // Proveedor que implementa la interfaz de repositorio de paises
  exports: [COUNTRY_REPOSITORY, CountryService], // Exportacion del proveedor y del servicio de paises
})
export class CountryModule {}
