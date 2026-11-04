import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BANK_REPOSITORY } from '@/application/ports/out/repositories/bank-repository.js';
import { BankService } from '@/application/services/bank-service.js';
import { BankController } from '@/infrastructure/http/controllers/bank.controller.js';
import { BankEntity } from '@/infrastructure/persistence/entities/bank.entity.js';
import { BankRepositoryTypeORM } from '@/infrastructure/persistence/repositories_impl/bank-repository-typeorm.js';
import { CountryModule } from './country.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([BankEntity]), CountryModule],
  controllers: [BankController],
  providers: [
    { provide: BANK_REPOSITORY, useClass: BankRepositoryTypeORM },
    BankService,
  ],
  exports: [BANK_REPOSITORY, BankService],
})
export class BankModule {}
