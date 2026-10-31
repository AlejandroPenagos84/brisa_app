import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './infrastructure/database.module.js';
import { OwnerModule } from './infrastructure/owner.module.js';

@Module({
  imports: [DatabaseModule, OwnerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
