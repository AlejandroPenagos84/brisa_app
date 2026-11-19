import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
  type Relation,
} from 'typeorm';
import { PropertyEntity } from '@/infrastructure/persistence/entities/property.entity.js';

// Metadata only: the bytes are kept by the PropertyImageStorage port
@Entity({ name: 'property_images' })
@Check('CHK_property_images_position', 'position >= 0')
@Unique('UQ_property_images_position', ['propertyId', 'position'], {
  deferrable: 'INITIALLY DEFERRED',
})
export class PropertyImageEntity {
  @PrimaryColumn({ name: 'id', type: 'varchar', length: 36 })
  id: string;

  @Column({ name: 'property_id', type: 'varchar', length: 36 })
  propertyId: string;

  @ManyToOne(() => PropertyEntity, (property) => property.images, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'property_id' })
  property: Relation<PropertyEntity>;

  @Column({ name: 'file_name', type: 'varchar', length: 100 })
  fileName: string;

  @Column({ name: 'position', type: 'int' })
  position: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
