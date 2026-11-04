import { Rental, RentalKey } from '@/domain/rental.js';
import { RentalEntity } from '@/infrastructure/persistence/entities/rental.entity.js';

export class RentalMapper {
  static fromEntityToDomain(entity: RentalEntity): Rental {
    return new Rental(
      entity.propertyId,
      entity.clientId,
      RentalMapper.fromDateColumn(entity.checkInDate),
      RentalMapper.fromDateColumn(entity.checkOutDate),
      entity.chargedAmount,
      entity.status,
    );
  }

  static fromDomainToEntity(rental: Rental): RentalEntity {
    const data = rental.getData();
    const entity = new RentalEntity();
    entity.propertyId = data.propertyId;
    entity.clientId = data.clientId;
    entity.checkInDate = RentalMapper.toDateColumn(data.startDate);
    entity.checkOutDate = RentalMapper.toDateColumn(data.endDate);
    entity.chargedAmount = rental.getChargedAmount();
    entity.status = rental.getStatus();
    return entity;
  }

  // Use it in the repository to search, update or delete by composite key
  static fromKeyToEntityKey(
    key: RentalKey,
  ): Pick<RentalEntity, 'propertyId' | 'clientId' | 'checkInDate'> {
    return {
      propertyId: key.propertyId,
      clientId: key.clientId,
      checkInDate: RentalMapper.toDateColumn(key.startDate),
    };
  }

  // DATE columns have no time or time zone, so both directions use UTC
  // to avoid shifting the day: '2026-10-31' <-> 2026-10-31T00:00:00.000Z
  static toDateColumn(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private static fromDateColumn(value: string): Date {
    return new Date(`${value}T00:00:00.000Z`);
  }
}
