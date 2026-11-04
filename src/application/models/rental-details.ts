import { Client } from '@/domain/client.js';
import { Property } from '@/domain/property.js';
import { Rental } from '@/domain/rental.js';

export class RentalDetails {
  rental: Rental;
  property: Property;
  client: Client;
}
