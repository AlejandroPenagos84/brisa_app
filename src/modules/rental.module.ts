import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CLOCK, type Clock } from '@/application/ports/out/clock.js';
import {
  BANK_REPOSITORY,
  type BankRepository,
} from '@/application/ports/out/repositories/bank-repository.js';
import {
  CLIENT_REPOSITORY,
  type ClientRepository,
} from '@/application/ports/out/repositories/client-repository.js';
import {
  PROPERTY_REPOSITORY,
  type PropertyRepository,
} from '@/application/ports/out/repositories/property-repository.js';
import {
  RENTAL_REPOSITORY,
  type RentalRepository,
} from '@/application/ports/out/repositories/rental-repository.js';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '@/application/ports/out/repositories/unit-of-work.js';
import { RentalService } from '@/application/services/rental-service.js';
import { CancelRentalUseCase } from '@/application/use-cases/cancel-rental.use-case.js';
import { ReservePropertyUseCase } from '@/application/use-cases/reserve-property.use-case.js';
import { ClientRentalController } from '@/infrastructure/http/controllers/client-rental.controller.js';
import { RentalController } from '@/infrastructure/http/controllers/rental.controller.js';
import { RentalRepositoryTypeORM } from '@/infrastructure/persistence/repositories_impl/rental-repository-typeorm.js';
import { RentalStatusScheduler } from '@/infrastructure/scheduling/rental-status.scheduler.js';
import { BankModule } from './bank.module.js';
import { ClientModule } from './client.module.js';
import { ClockModule } from './clock.module.js';
import { PropertyModule } from './property.module.js';
import { UnitOfWorkModule } from './unit-of-work.module.js';

@Module({
  imports: [
    ClientModule,
    PropertyModule,
    BankModule,
    ClockModule,
    UnitOfWorkModule,
  ],
  controllers: [RentalController, ClientRentalController],
  providers: [
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
        clock: Clock,
      ) =>
        new RentalService(
          rentalRepository,
          clientRepository,
          propertyRepository,
          clock,
        ),
      inject: [
        RENTAL_REPOSITORY,
        CLIENT_REPOSITORY,
        PROPERTY_REPOSITORY,
        CLOCK,
      ],
    },
    {
      provide: ReservePropertyUseCase,
      useFactory: (
        unitOfWork: UnitOfWork,
        bankRepository: BankRepository,
        clock: Clock,
      ) => new ReservePropertyUseCase(unitOfWork, bankRepository, clock),
      inject: [UNIT_OF_WORK, BANK_REPOSITORY, CLOCK],
    },
    {
      provide: CancelRentalUseCase,
      useFactory: (
        unitOfWork: UnitOfWork,
        bankRepository: BankRepository,
        clock: Clock,
      ) => new CancelRentalUseCase(unitOfWork, bankRepository, clock),
      inject: [UNIT_OF_WORK, BANK_REPOSITORY, CLOCK],
    },
    RentalStatusScheduler,
  ],
  exports: [RENTAL_REPOSITORY, RentalService],
})
export class RentalModule {}
