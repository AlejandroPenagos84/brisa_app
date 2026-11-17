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
import { AdministratorTransactionEntity } from '@/infrastructure/persistence/entities/administrator-transaction.entity.js';
import { BankEntity } from '@/infrastructure/persistence/entities/bank.entity.js';
import { decimalTransformer } from '@/infrastructure/persistence/entities/decimal.transformer.js';

// Single row: script.sql enforces it with a unique index on a constant
@Entity({ name: 'administrators' })
@Check('CHK_administrators_balance', 'balance >= 0')
export class AdministratorEntity {
  @PrimaryColumn({ name: 'id', type: 'varchar', length: 36 })
  id: string;

  @Column({ name: 'name', type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'phone', type: 'varchar', length: 20 })
  phone: string;

  @Column({ name: 'email', type: 'varchar', length: 150 })
  email: string;

  // Bank account that receives the payments of the rentals
  @Column({ name: 'bank_id', type: 'varchar', length: 36 })
  bankId: string;

  @ManyToOne(() => BankEntity, { nullable: false })
  @JoinColumn({ name: 'bank_id' })
  bank: Relation<BankEntity>;

  @Column({ name: 'account_number', type: 'varchar', length: 30 })
  accountNumber: string;

  @Column({ name: 'account_type', type: 'varchar', length: 50 })
  accountType: string;

  // Accumulated commissions (10% of every rental)
  @Column({
    name: 'balance',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  balance: number;

  @OneToMany(
    () => AdministratorTransactionEntity,
    (transaction) => transaction.administrator,
  )
  transactions: Relation<AdministratorTransactionEntity[]>;
}
