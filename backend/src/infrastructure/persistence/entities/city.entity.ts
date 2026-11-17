import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { ClientEntity } from '@/infrastructure/persistence/entities/client.entity.js';
import { CountryEntity } from '@/infrastructure/persistence/entities/country.entity.js';
import { PropertyEntity } from '@/infrastructure/persistence/entities/property.entity.js';

@Entity({ name: 'cities' })
export class CityEntity {
  @PrimaryColumn({ name: 'id', type: 'varchar', length: 36 })
  id: string;

  @Column({ name: 'name', type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'country_id', type: 'varchar', length: 36 })
  countryId: string;

  @ManyToOne(() => CountryEntity, (country) => country.cities, {
    nullable: false,
  })
  @JoinColumn({ name: 'country_id' })
  country: Relation<CountryEntity>;

  @OneToMany(() => ClientEntity, (client) => client.city)
  clients: Relation<ClientEntity[]>;

  @OneToMany(() => PropertyEntity, (property) => property.city)
  properties: Relation<PropertyEntity[]>;
}
