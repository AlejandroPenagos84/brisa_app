import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PROPERTY_REPOSITORY } from '@/application/ports/out/repositories/property-repository.js';
import { PropertyService } from '@/application/services/property-service.js';
import { PropertyController } from '@/infrastructure/http/controllers/property.controller.js';
import { PropertyEntity } from '@/infrastructure/persistence/entities/property.entity.js';
import { PropertyRepositoryTypeORM } from '@/infrastructure/persistence/repositories_impl/property-repository-typeorm.js';
import { CityModule } from './city.module.js';
import { OwnerModule } from './owner.module.js';
import { BankModule } from './bank.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([PropertyEntity]),
    CityModule,
    OwnerModule,
    BankModule,
  ],
  controllers: [PropertyController],
  providers: [
    { provide: PROPERTY_REPOSITORY, useClass: PropertyRepositoryTypeORM },
    PropertyService,
  ],
  exports: [PROPERTY_REPOSITORY, PropertyService],
})
export class PropertyModule {}
