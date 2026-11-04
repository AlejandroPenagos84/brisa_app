import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RENTAL_REPOSITORY } from '@/application/ports/out/repositories/rental-repository.js';
import { RentalService } from '@/application/services/rental-service.js';
import { RentalController } from '@/infrastructure/http/controllers/rental.controller.js';
import { RentalEntity } from '@/infrastructure/persistence/entities/rental.entity.js';
import { RentalRepositoryTypeORM } from '@/infrastructure/persistence/repositories_impl/rental-repository-typeorm.js';
import { RentalStatusScheduler } from '@/infrastructure/scheduling/rental-status.scheduler.js';
import { ClientModule } from './client.module.js';
import { PropertyModule } from './property.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([RentalEntity]),
    ClientModule,
    PropertyModule,
  ],
  controllers: [RentalController],
  providers: [
    { provide: RENTAL_REPOSITORY, useClass: RentalRepositoryTypeORM },
    RentalService,
    RentalStatusScheduler,
  ],
  exports: [RENTAL_REPOSITORY, RentalService],
})
export class RentalModule {}
