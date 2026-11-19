import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CLOCK, type Clock } from '@/application/ports/out/clock.js';
import {
  PROPERTY_IMAGE_STORAGE,
  type PropertyImageStorage,
} from '@/application/ports/out/property-image-storage.js';
import {
  BANK_REPOSITORY,
  type BankRepository,
} from '@/application/ports/out/repositories/bank-repository.js';
import {
  CITY_REPOSITORY,
  type CityRepository,
} from '@/application/ports/out/repositories/city-repository.js';
import {
  OWNER_REPOSITORY,
  type OwnerRepository,
} from '@/application/ports/out/repositories/owner-repository.js';
import {
  PROPERTY_REPOSITORY,
  type PropertyRepository,
} from '@/application/ports/out/repositories/property-repository.js';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '@/application/ports/out/repositories/unit-of-work.js';
import { PropertyService } from '@/application/services/property-service.js';
import { AddPropertyImageUseCase } from '@/application/use-cases/add-property-image.use-case.js';
import { AddPropertyUseCase } from '@/application/use-cases/add-property.use-case.js';
import { EditPropertyUseCase } from '@/application/use-cases/edit-property.use-case.js';
import { RemovePropertyImageUseCase } from '@/application/use-cases/remove-property-image.use-case.js';
import { RemovePropertyUseCase } from '@/application/use-cases/remove-property.use-case.js';
import { PropertyController } from '@/infrastructure/http/controllers/property.controller.js';
import { PropertyRepositoryTypeORM } from '@/infrastructure/persistence/repositories_impl/property-repository-typeorm.js';
import { BankModule } from './bank.module.js';
import { CityModule } from './city.module.js';
import { ClockModule } from './clock.module.js';
import { OwnerModule } from './owner.module.js';
import { StorageModule } from './storage.module.js';
import { UnitOfWorkModule } from './unit-of-work.module.js';

@Module({
  imports: [
    CityModule,
    OwnerModule,
    BankModule,
    ClockModule,
    UnitOfWorkModule,
    StorageModule,
  ],
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
        clock: Clock,
      ) =>
        new PropertyService(
          propertyRepository,
          ownerRepository,
          bankRepository,
          cityRepository,
          clock,
        ),
      inject: [
        PROPERTY_REPOSITORY,
        OWNER_REPOSITORY,
        BANK_REPOSITORY,
        CITY_REPOSITORY,
        CLOCK,
      ],
    },
    {
      provide: AddPropertyUseCase,
      useFactory: (
        ownerRepository: OwnerRepository,
        cityRepository: CityRepository,
        propertyRepository: PropertyRepository,
      ) =>
        new AddPropertyUseCase(
          ownerRepository,
          cityRepository,
          propertyRepository,
        ),
      inject: [OWNER_REPOSITORY, CITY_REPOSITORY, PROPERTY_REPOSITORY],
    },
    {
      provide: EditPropertyUseCase,
      useFactory: (unitOfWork: UnitOfWork, clock: Clock) =>
        new EditPropertyUseCase(unitOfWork, clock),
      inject: [UNIT_OF_WORK, CLOCK],
    },
    {
      provide: RemovePropertyUseCase,
      useFactory: (
        unitOfWork: UnitOfWork,
        clock: Clock,
        imageStorage: PropertyImageStorage,
      ) => new RemovePropertyUseCase(unitOfWork, clock, imageStorage),
      inject: [UNIT_OF_WORK, CLOCK, PROPERTY_IMAGE_STORAGE],
    },
    {
      provide: AddPropertyImageUseCase,
      useFactory: (unitOfWork: UnitOfWork, imageStorage: PropertyImageStorage) =>
        new AddPropertyImageUseCase(unitOfWork, imageStorage),
      inject: [UNIT_OF_WORK, PROPERTY_IMAGE_STORAGE],
    },
    {
      provide: RemovePropertyImageUseCase,
      useFactory: (unitOfWork: UnitOfWork, imageStorage: PropertyImageStorage) =>
        new RemovePropertyImageUseCase(unitOfWork, imageStorage),
      inject: [UNIT_OF_WORK, PROPERTY_IMAGE_STORAGE],
    },
  ],
  exports: [PROPERTY_REPOSITORY, PropertyService],
})
export class PropertyModule {}
