import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OwnerService } from '@/application/owner-service.js';
import { OWNER_REPOSITORY } from '@/application/ports/out/repositories/owner-repository.js';
import { OwnerController } from '@/infrastructure/http/controllers/owner.controller.js';
import { OwnerEntity } from '@/infrastructure/persistence/entities/owner.entity.js';
import { OwnerRepositoryTypeORM } from '@/infrastructure/persistence/repositories_impl/owner-repository-typeorm.js';

@Module({
  imports: [TypeOrmModule.forFeature([OwnerEntity])],
  controllers: [OwnerController],
  providers: [
    { provide: OWNER_REPOSITORY, useClass: OwnerRepositoryTypeORM },
    OwnerService,
  ],
  exports: [OWNER_REPOSITORY],
})
export class OwnerModule {}
