import { City } from '@/domain/city.js';
import { Country } from '@/domain/country.js';

export interface CityDetails {
  city: City;
  country: Country;
}
