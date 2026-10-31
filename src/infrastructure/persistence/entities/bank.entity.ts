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
import { OwnerEntity } from '@/infrastructure/persistence/entities/owner.entity.js';
import { Injectable } from '@nestjs/common/decorators/core/index.js';

@Entity({ name: 'banks' })
@Injectable()
export class BankEntity {
  @PrimaryColumn({ name: 'id', type: 'varchar', length: 36 })
  id: string;

  @Column({ name: 'name', type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'country_id', type: 'varchar', length: 36 })
  countryId: string;

  @ManyToOne(() => CountryEntity, (country) => country.banks, {
    nullable: false,
  })
  @JoinColumn({ name: 'country_id' })
  country: Relation<CountryEntity>;

  @OneToMany(() => OwnerEntity, (owner) => owner.bank)
  owners: Relation<OwnerEntity[]>;

  @OneToMany(() => ClientEntity, (client) => client.bank)
  clients: Relation<ClientEntity[]>;
}
