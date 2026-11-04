import { randomUUID } from 'node:crypto';
import { Bank } from '@/domain/bank.js';
import type { BankDetails } from '@/application/models/bank-details.js';
import {
  BankResponse,
  BankDetailsResponse,
} from '../dto/response/bank.response.js';
import { BankSummaryHttpMapper } from './bank-summary-http.mapper.js';
import { CountryHttpMapper } from './country-http.mapper.js';
import { CreateBankRequest } from '../dto/request/create/create-bank.request.js';
import { UpdateBankRequest } from '../dto/request/update/update-bank.request.js';
import { omitUndefined, trimText } from './mapping.utils.js';

export class BankHttpMapper {
  static fromCreateRequestToDomain(request: CreateBankRequest): Bank {
    return new Bank(randomUUID(), trimText(request.name), request.countryId);
  }

  static fromUpdateRequestToData(
    request: UpdateBankRequest,
  ): Partial<ReturnType<Bank['getData']>> {
    return omitUndefined({
      name: trimText(request.name),
      countryId: request.countryId,
    });
  }

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
