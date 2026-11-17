import { UNIT_OF_WORK } from '@/application/ports/out/repositories/unit-of-work.js';
import { TypeOrmUnitOfWork } from '@/infrastructure/persistence/typeorm-unit-of-work.js';
import { Module } from '@nestjs/common';

@Module({
  imports: [],
  controllers: [],
  providers: [{ provide: UNIT_OF_WORK, useClass: TypeOrmUnitOfWork }],
  exports: [UNIT_OF_WORK],
})
export class UnitOfWorkModule {}
