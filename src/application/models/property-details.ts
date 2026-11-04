import { Bank } from '@/domain/bank.js';
import { City } from '@/domain/city.js';
import { Owner } from '@/domain/owner.js';
import { Property } from '@/domain/property.js';

export interface PropertyDetails {
  property: Property;
  owner: Owner;
  ownerBank: Bank;
  city: City;
}
