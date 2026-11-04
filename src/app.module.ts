import './env.js';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './modules/database.module.js';
import { OwnerModule } from './modules/owner.module.js';
import { BankModule } from './modules/bank.module.js';
import { CountryModule } from './modules/country.module.js';
import { CityModule } from './modules/city.module.js';
import { PropertyModule } from './modules/property.module.js';
import { ClientModule } from './modules/client.module.js';
import { RentalModule } from './modules/rental.module.js';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    DatabaseModule,
    CountryModule,
    CityModule,
    BankModule,
    OwnerModule,
    PropertyModule,
    ClientModule,
    RentalModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
