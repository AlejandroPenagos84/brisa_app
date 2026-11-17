import { Module } from '@nestjs/common';
import { CLOCK } from '@/application/ports/out/clock.js';
import { BusinessClock } from '@/infrastructure/time/business-clock.js';

// Single source of "today" for every module
@Module({
  providers: [{ provide: CLOCK, useClass: BusinessClock }],
  exports: [CLOCK],
})
export class ClockModule {}
