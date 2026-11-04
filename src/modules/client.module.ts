import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CLIENT_REPOSITORY } from '@/application/ports/out/repositories/client-repository.js';
import { ClientService } from '@/application/services/client-service.js';
import { ClientController } from '@/infrastructure/http/controllers/client.controller.js';
import { ClientEntity } from '@/infrastructure/persistence/entities/client.entity.js';
import { ClientRepositoryTypeORM } from '@/infrastructure/persistence/repositories_impl/client-repository-typeorm.js';
import { CityModule } from './city.module.js';
import { BankModule } from './bank.module.js';
import { CountryModule } from './country.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClientEntity]),
    CityModule,
    BankModule,
    CountryModule,
  ],
  controllers: [ClientController],
  providers: [
    { provide: CLIENT_REPOSITORY, useClass: ClientRepositoryTypeORM },
    ClientService,
  ],
  exports: [CLIENT_REPOSITORY, ClientService],
})
export class ClientModule {}
