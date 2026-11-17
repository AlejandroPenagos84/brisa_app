import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { TransactionType } from '@/domain/administrator-transaction.js';
import { AdministratorEntity } from '@/infrastructure/persistence/entities/administrator.entity.js';
import { decimalTransformer } from '@/infrastructure/persistence/entities/decimal.transformer.js';
import { OwnerEntity } from '@/infrastructure/persistence/entities/owner.entity.js';

// Junction table administrator ↔ owner: one row per money movement.
// Rows are never updated; they are deleted only together with their owner.
@Entity({ name: 'administrator_owner_transactions' })
@Check('CHK_aot_type', "type IN ('PAYMENT', 'REFUND')")
@Check(
  'CHK_aot_amounts',
  'gross_amount > 0 AND commission >= 0 AND net_amount >= 0 AND net_amount = gross_amount - commission',
)
@Index('IX_aot_owner_created_at', ['ownerId', 'createdAt'])
export class AdministratorTransactionEntity {
  @PrimaryColumn({ name: 'id', type: 'varchar', length: 36 })
  id: string;

  @Column({ name: 'administrator_id', type: 'varchar', length: 36 })
  administratorId: string;

  @ManyToOne(() => AdministratorEntity, (admin) => admin.transactions, {
    nullable: false,
  })
  @JoinColumn({ name: 'administrator_id' })
  administrator: Relation<AdministratorEntity>;

  @Column({ name: 'owner_id', type: 'varchar', length: 36 })
  ownerId: string;

  @ManyToOne(() => OwnerEntity, (owner) => owner.transactions, {
    nullable: false,
  })
  @JoinColumn({ name: 'owner_id' })
  owner: Relation<OwnerEntity>;

  @Column({ name: 'type', type: 'varchar', length: 10 })
  type: TransactionType;

  // What the client paid
  @Column({
    name: 'gross_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  grossAmount: number;

  // What the administrator keeps
  @Column({
    name: 'commission',
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  commission: number;

  // What the owner receives
  @Column({
    name: 'net_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  netAmount: number;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
