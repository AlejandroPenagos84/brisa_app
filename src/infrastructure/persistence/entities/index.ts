import { AdministratorTransactionEntity } from '@/infrastructure/persistence/entities/administrator-transaction.entity.js';
import { AdministratorEntity } from '@/infrastructure/persistence/entities/administrator.entity.js';
import { BankEntity } from '@/infrastructure/persistence/entities/bank.entity.js';
import { CityEntity } from '@/infrastructure/persistence/entities/city.entity.js';
import { ClientEntity } from '@/infrastructure/persistence/entities/client.entity.js';
import { CountryEntity } from '@/infrastructure/persistence/entities/country.entity.js';
import { OwnerEntity } from '@/infrastructure/persistence/entities/owner.entity.js';
import { PropertyEntity } from '@/infrastructure/persistence/entities/property.entity.js';
import { RentalEntity } from '@/infrastructure/persistence/entities/rental.entity.js';

export {
  AdministratorEntity,
  AdministratorTransactionEntity,
  BankEntity,
  CityEntity,
  ClientEntity,
  CountryEntity,
  OwnerEntity,
  PropertyEntity,
  RentalEntity,
};

// Use this list in TypeOrmModule.forRoot({ entities }) and TypeOrmModule.forFeature(entities)
export const entities = [
  CountryEntity,
  CityEntity,
  BankEntity,
  OwnerEntity,
  ClientEntity,
  PropertyEntity,
  RentalEntity,
  AdministratorEntity,
  AdministratorTransactionEntity,
];
