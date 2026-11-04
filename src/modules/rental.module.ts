import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  RENTAL_REPOSITORY,
  type RentalRepository,
} from '@/application/ports/out/repositories/rental-repository.js';
import { RentalService } from '@/application/services/rental-service.js';
import { RentalController } from '@/infrastructure/http/controllers/rental.controller.js';
import { RentalRepositoryTypeORM } from '@/infrastructure/persistence/repositories_impl/rental-repository-typeorm.js';
import { RentalStatusScheduler } from '@/infrastructure/scheduling/rental-status.scheduler.js';
import { ClientModule } from './client.module.js';
import { PropertyModule } from './property.module.js';
import { UnitOfWorkModule } from './unit-of-work.module.js';
import {
  CLIENT_REPOSITORY,
  type ClientRepository,
} from '@/application/ports/out/repositories/client-repository.js';
import {
  PROPERTY_REPOSITORY,
  type PropertyRepository,
} from '@/application/ports/out/repositories/property-repository.js';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '@/application/ports/out/repositories/unit-of-work.js';
import { CLOCK, type Clock } from '@/application/ports/out/clock.js';
import { BusinessClock } from '@/infrastructure/time/business-clock.js';

@Module({
  imports: [ClientModule, PropertyModule, UnitOfWorkModule],
  controllers: [RentalController],
  providers: [
    { provide: CLOCK, useClass: BusinessClock },
    {
      provide: RENTAL_REPOSITORY,
      useFactory: (dataSource: DataSource) =>
        new RentalRepositoryTypeORM(dataSource.manager),
      inject: [DataSource],
    },
    {
      provide: RentalService,
      useFactory: (
        rentalRepository: RentalRepository,
        clientRepository: ClientRepository,
        propertyRepository: PropertyRepository,
        unitOfWork: UnitOfWork,
        clock: Clock,
      ) =>
        new RentalService(
          rentalRepository,
          clientRepository,
          propertyRepository,
          unitOfWork,
          clock,
        ),
      inject: [
        RENTAL_REPOSITORY,
        CLIENT_REPOSITORY,
        PROPERTY_REPOSITORY,
        UNIT_OF_WORK,
        CLOCK,
      ],
    },
    RentalStatusScheduler,
  ],
  exports: [RENTAL_REPOSITORY, RentalService],
})
export class RentalModule {}
