import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  PROPERTY_REPOSITORY,
  type PropertyRepository,
} from '@/application/ports/out/repositories/property-repository.js';
import { PropertyService } from '@/application/services/property-service.js';
import { PropertyController } from '@/infrastructure/http/controllers/property.controller.js';
import { PropertyRepositoryTypeORM } from '@/infrastructure/persistence/repositories_impl/property-repository-typeorm.js';
import { CityModule } from './city.module.js';
import { OwnerModule } from './owner.module.js';
import { BankModule } from './bank.module.js';
import {
  OWNER_REPOSITORY,
  type OwnerRepository,
} from '@/application/ports/out/repositories/owner-repository.js';
import {
  BANK_REPOSITORY,
  type BankRepository,
} from '@/application/ports/out/repositories/bank-repository.js';
import {
  CITY_REPOSITORY,
  type CityRepository,
} from '@/application/ports/out/repositories/city-repository.js';

@Module({
  imports: [CityModule, OwnerModule, BankModule],
  controllers: [PropertyController],
  providers: [
    {
      provide: PROPERTY_REPOSITORY,
      useFactory: (dataSource: DataSource) =>
        new PropertyRepositoryTypeORM(dataSource.manager),
      inject: [DataSource],
    },
    {
      provide: PropertyService,
      useFactory: (
        propertyRepository: PropertyRepository,
        ownerRepository: OwnerRepository,
        bankRepository: BankRepository,
        cityRepository: CityRepository,
      ) =>
        new PropertyService(
          propertyRepository,
          ownerRepository,
          bankRepository,
          cityRepository,
        ),
      inject: [
        PROPERTY_REPOSITORY,
        OWNER_REPOSITORY,
        BANK_REPOSITORY,
        CITY_REPOSITORY,
      ],
    },
  ],
  exports: [PROPERTY_REPOSITORY, PropertyService],
})
export class PropertyModule {}
