import { Rental, RentalKey } from '@/domain/rental.js';
import { UUID } from '@/utils/types.js';

export const RENTAL_REPOSITORY = Symbol('RentalRepository');

// "Current" rentals are the ones that have not finished on the given day
// (check-out date >= today). The domain decides what to do with them.
export interface RentalRepository {
  findAll(): Promise<Rental[]>;
  findByClientId(clientId: UUID): Promise<Rental[]>;
  findByKeys(keys: RentalKey[]): Promise<Rental[]>;
  findByKey(key: RentalKey): Promise<Rental | null>;
  findCurrentByPropertyId(propertyId: UUID, today: Date): Promise<Rental[]>;
  findCurrentByClientId(clientId: UUID, today: Date): Promise<Rental[]>;
  findCurrentByPropertyIds(propertyIds: UUID[], today: Date): Promise<Rental[]>;
  updateStatuses(rentals: Rental[]): Promise<void>;
  save(rental: Rental): Promise<Rental>;
  update(key: RentalKey, rental: Rental): Promise<Rental>;
  // Throws NotFoundError if the rental does not exist
  delete(key: RentalKey): Promise<boolean>;
}
