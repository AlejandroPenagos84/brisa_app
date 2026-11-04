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
import { decimalTransformer } from '@/infrastructure/persistence/entities/decimal.transformer.js';
import { PropertyEntity } from '@/infrastructure/persistence/entities/property.entity.js';

@Entity({ name: 'owners' })
@Check('CHK_owners_balance', 'balance >= 0')
export class OwnerEntity {
  @PrimaryColumn({ name: 'id', type: 'varchar', length: 36 })
  id: string;

  @Column({ name: 'name', type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'phone', type: 'varchar', length: 20 })
  phone: string;

  @Column({ name: 'email', type: 'varchar', length: 150 })
  email: string;

  @Column({ name: 'bank_id', type: 'varchar', length: 36 })
  bankId: string;

  @ManyToOne(() => BankEntity, (bank) => bank.owners, { nullable: false })
  @JoinColumn({ name: 'bank_id' })
  bank: Relation<BankEntity>;

  // Money received from rentals of the owner's properties
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
}
