import { Bank } from '@/domain/bank.js';
import { Country } from '@/domain/country.js';

export interface BankDetails {
  bank: Bank;
  country: Country;
}
