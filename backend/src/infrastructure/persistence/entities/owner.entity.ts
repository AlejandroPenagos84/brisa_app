import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  Unique,
  type Relation,
} from 'typeorm';
import { AdministratorTransactionEntity } from '@/infrastructure/persistence/entities/administrator-transaction.entity.js';
import { BankEntity } from '@/infrastructure/persistence/entities/bank.entity.js';
import { decimalTransformer } from '@/infrastructure/persistence/entities/decimal.transformer.js';
import { PropertyEntity } from '@/infrastructure/persistence/entities/property.entity.js';

@Entity({ name: 'owners' })
@Check('CHK_owners_balance', 'balance >= 0')
@Unique('UQ_owners_bank_account', ['bankId', 'accountNumber'])
export class OwnerEntity {
  @PrimaryColumn({ name: 'id', type: 'varchar', length: 36 })
  id: string;

  @Column({ name: 'name', type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'phone', type: 'varchar', length: 20 })
  phone: string;

  @Column({ name: 'email', type: 'varchar', length: 150 })
  email: string;

  // Bank account where the owner receives the net amount of the rentals
  @Column({ name: 'bank_id', type: 'varchar', length: 36 })
  bankId: string;

  @ManyToOne(() => BankEntity, (bank) => bank.owners, { nullable: false })
  @JoinColumn({ name: 'bank_id' })
  bank: Relation<BankEntity>;

  @Column({ name: 'account_number', type: 'varchar', length: 30 })
  accountNumber: string;

  @Column({ name: 'account_type', type: 'varchar', length: 50 })
  accountType: string;

  // Net amount (90%) received from the rentals of the owner's properties
  @Column({
    name: 'balance',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  balance: number;

  @OneToMany(() => PropertyEntity, (property) => property.owner)
  properties: Relation<PropertyEntity[]>;

  @OneToMany(
    () => AdministratorTransactionEntity,
    (transaction) => transaction.owner,
  )
  transactions: Relation<AdministratorTransactionEntity[]>;
}
