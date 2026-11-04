import { Bank } from '@/domain/bank.js';
import type { BankDetails } from '@/application/models/bank-details.js';
import {
  BankResponse,
  BankDetailsResponse,
} from '../dto/response/bank.response.js';
import { BankSummaryHttpMapper } from './bank-summary-http.mapper.js';
import { CountryHttpMapper } from './country-http.mapper.js';

export class BankHttpMapper {
  static fromDomainToResponse(bank: Bank): BankResponse {
    return {
      ...BankSummaryHttpMapper.fromDomainToResponse(bank),
      countryId: bank.getCountryId(),
    };
  }

  static fromDetailsToResponse(details: BankDetails): BankDetailsResponse {
    return {
      ...this.fromDomainToResponse(details.bank),
      country: CountryHttpMapper.fromDomainToResponse(details.country),
    };
  }
}
