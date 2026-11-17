// Builders for the domain unit tests. Only imported from *.spec.ts files.
import { Administrator } from '@/domain/administrator.js';
import { Bank } from '@/domain/bank.js';
import { Client } from '@/domain/client.js';
import { Owner } from '@/domain/owner.js';
import { Property } from '@/domain/property.js';
import { Rental } from '@/domain/rental.js';

export const IDS = {
  bank: 'b0000000-0000-4000-8000-000000000001',
  otherBank: 'b0000000-0000-4000-8000-000000000002',
  owner: 'a0000000-0000-4000-8000-000000000001',
  otherOwner: 'a0000000-0000-4000-8000-000000000002',
  client: 'd0000000-0000-4000-8000-000000000001',
  otherClient: 'd0000000-0000-4000-8000-000000000002',
  property: 'e0000000-0000-4000-8000-000000000001',
  otherProperty: 'e0000000-0000-4000-8000-000000000002',
  administrator: 'f0000000-0000-4000-8000-000000000001',
  city: 'c0000000-0000-4000-8000-000000000001',
  country: '11111111-1111-4111-8111-111111111111',
};

// Calendar day at UTC midnight, like the rental dates
export function day(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function aBank(id = IDS.bank): Bank {
  return new Bank(id, 'Bancolombia', IDS.country);
}

export function aClient(bankId = IDS.bank): Client {
  return new Client(
    IDS.client,
    'Sofía Ramírez',
    '3201112233',
    'sofia@example.com',
    IDS.city,
    bankId,
    '1002003001',
    'Ahorros',
  );
}

export function anOwner(balance = 0, id = IDS.owner): Owner {
  return new Owner(
    id,
    'Ana Gómez',
    '3001234567',
    'ana@example.com',
    IDS.bank,
    '5001001001',
    'Ahorros',
    balance,
  );
}

export function anAdministrator(balance = 0): Administrator {
  return new Administrator(
    IDS.administrator,
    'Brisa Admin',
    '3000000000',
    'admin@brisa.com',
    IDS.bank,
    '9001001001',
    'Corriente',
    balance,
  );
}

export function aProperty(
  pricePerNight = 100,
  manuallyInactive = false,
  ownerId = IDS.owner,
): Property {
  return new Property(
    IDS.property,
    ownerId,
    IDS.city,
    'Calle 45 #12-30',
    65,
    2,
    4,
    pricePerNight,
    manuallyInactive,
  );
}

export function aRental(
  start: string,
  end: string,
  cost = 0,
  propertyId = IDS.property,
  clientId = IDS.client,
): Rental {
  return new Rental(propertyId, clientId, day(start), day(end), cost);
}
