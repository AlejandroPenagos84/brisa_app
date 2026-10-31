import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { BankEntity } from '@/infrastructure/persistence/entities/bank.entity.js';
import { CityEntity } from '@/infrastructure/persistence/entities/city.entity.js';
import { decimalTransformer } from '@/infrastructure/persistence/entities/decimal.transformer.js';
import { RentalEntity } from '@/infrastructure/persistence/entities/rental.entity.js';

@Entity({ name: 'clients' })
@Check('CHK_clients_balance', 'balance >= 0')
export class ClientEntity {
  @PrimaryColumn({ name: 'id', type: 'varchar', length: 36 })
  id: string;

  @Column({ name: 'name', type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'phone', type: 'varchar', length: 20 })
  phone: string;

  @Column({ name: 'email', type: 'varchar', length: 150 })
  email: string;

  // City where the client lives
  @Column({ name: 'city_id', type: 'varchar', length: 36 })
  cityId: string;

  @ManyToOne(() => CityEntity, (city) => city.clients, { nullable: false })
  @JoinColumn({ name: 'city_id' })
  city: Relation<CityEntity>;

  // Bank account linked to the client
  @Column({ name: 'bank_id', type: 'varchar', length: 36 })
  bankId: string;

  @ManyToOne(() => BankEntity, (bank) => bank.clients, { nullable: false })
  @JoinColumn({ name: 'bank_id' })
  bank: Relation<BankEntity>;

  @Column({ name: 'account_number', type: 'varchar', length: 30 })
  accountNumber: string;

  @Column({
    name: 'account_type',
    type: 'varchar',
    length: 50,
  })
  accountType: string;

  @Column({
    name: 'balance',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  balance: number;

  @OneToMany(() => RentalEntity, (rental) => rental.client)
  rentals: Relation<RentalEntity[]>;
}
