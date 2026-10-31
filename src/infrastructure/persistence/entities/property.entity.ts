import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { CityEntity } from '@/infrastructure/persistence/entities/city.entity.js';
import { decimalTransformer } from '@/infrastructure/persistence/entities/decimal.transformer.js';
import { OwnerEntity } from '@/infrastructure/persistence/entities/owner.entity.js';
import { RentalEntity } from '@/infrastructure/persistence/entities/rental.entity.js';

@Entity({ name: 'properties' })
export class PropertyEntity {
  @PrimaryColumn({ name: 'id', type: 'varchar', length: 36 })
  id: string;

  @Column({ name: 'address', type: 'varchar', length: 200 })
  address: string;

  @Column({
    name: 'area',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  area: number;

  @Column({ name: 'number_of_rooms', type: 'int' })
  numberOfRooms: number;

  @Column({ name: 'capacity', type: 'int' })
  capacity: number;

  @Column({
    name: 'price_per_night',
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  pricePerNight: number;

  @Column({ name: 'owner_id', type: 'varchar', length: 36 })
  ownerId: string;

  @ManyToOne(() => OwnerEntity, (owner) => owner.properties, {
    nullable: false,
  })
  @JoinColumn({ name: 'owner_id' })
  owner: Relation<OwnerEntity>;

  @Column({ name: 'city_id', type: 'varchar', length: 36 })
  cityId: string;

  @ManyToOne(() => CityEntity, (city) => city.properties, { nullable: false })
  @JoinColumn({ name: 'city_id' })
  city: Relation<CityEntity>;

  @OneToMany(() => RentalEntity, (rental) => rental.property)
  rentals: Relation<RentalEntity[]>;
}
