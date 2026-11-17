import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { ClientEntity } from '@/infrastructure/persistence/entities/client.entity.js';
import { decimalTransformer } from '@/infrastructure/persistence/entities/decimal.transformer.js';
import { PropertyEntity } from '@/infrastructure/persistence/entities/property.entity.js';
import { RentalStatus } from '@/domain/rental.js';

@Entity({ name: 'rentals' })
@Check('CHK_rentals_dates', 'check_out_date > check_in_date')
@Check(
  'CHK_rentals_status',
  "status IN ('UPCOMING','ACTIVE','FINISHED')",
)
export class RentalEntity {
  // Composite primary key: (property_id, client_id, check_in_date)
  @PrimaryColumn({ name: 'property_id', type: 'varchar', length: 36 })
  propertyId: string;

  @PrimaryColumn({ name: 'client_id', type: 'varchar', length: 36 })
  clientId: string;

  // DATE columns are returned as 'YYYY-MM-DD' strings
  @PrimaryColumn({ name: 'check_in_date', type: 'date' })
  checkInDate: string;

  @Column({ name: 'check_out_date', type: 'date' })
  checkOutDate: string;

  // Amount charged to the client when the rental was created
  @Column({
    name: 'charged_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  chargedAmount: number;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    default: RentalStatus.UPCOMING,
  })
  status: RentalStatus;

  @ManyToOne(() => PropertyEntity, (property) => property.rentals, {
    nullable: false,
  })
  @JoinColumn({ name: 'property_id' })
  property: Relation<PropertyEntity>;

  @ManyToOne(() => ClientEntity, (client) => client.rentals, {
    nullable: false,
  })
  @JoinColumn({ name: 'client_id' })
  client: Relation<ClientEntity>;
}
