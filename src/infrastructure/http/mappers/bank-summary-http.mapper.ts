import { Bank } from '@/domain/bank.js';
import { BankSummaryResponse } from '../dto/response/bank-summary.response.js';

export class BankSummaryHttpMapper {
  static fromDomainToResponse(bank: Bank): BankSummaryResponse {
    const data = bank.getData();
    return { id: data.id, name: data.name };
  }
}
