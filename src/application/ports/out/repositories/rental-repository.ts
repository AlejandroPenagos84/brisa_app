import { Rental, RentalKey } from '@/domain/rental.js';
import { UUID } from '@/utils/types.js';

export const RENTAL_REPOSITORY = Symbol('RentalRepository');

export interface RentalRepository {
  findAll(): Promise<Rental[]>;
  findByClientId(clientId: UUID): Promise<Rental[]>;
  findByKeys(keys: RentalKey[]): Promise<Rental[]>;
  findByKey(key: RentalKey): Promise<Rental | null>;
  save(rental: Rental): Promise<Rental>;
  update(key: RentalKey, rental: Rental): Promise<Rental>;
  delete(key: RentalKey): Promise<boolean>;
}
