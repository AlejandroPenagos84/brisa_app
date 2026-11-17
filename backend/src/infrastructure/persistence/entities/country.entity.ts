import {
  Column,
  Entity,
  OneToMany,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { BankEntity } from '@/infrastructure/persistence/entities/bank.entity.js';
import { CityEntity } from '@/infrastructure/persistence/entities/city.entity.js';

@Entity({ name: 'countries' })
export class CountryEntity {
  @PrimaryColumn({ name: 'id', type: 'varchar', length: 36 })
  id: string;

  @Column({ name: 'name', type: 'varchar', length: 100 })
  name: string;

  @OneToMany(() => CityEntity, (city) => city.country)
  cities: Relation<CityEntity[]>;

  @OneToMany(() => BankEntity, (bank) => bank.country)
  banks: Relation<BankEntity[]>;
}
