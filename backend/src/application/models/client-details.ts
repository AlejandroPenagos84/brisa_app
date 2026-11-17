import { Bank } from '@/domain/bank.js';
import { Client } from '@/domain/client.js';
import { Country } from '@/domain/country.js';

export interface ClientDetails {
  client: Client;
  bank: Bank;
  country: Country;
}
