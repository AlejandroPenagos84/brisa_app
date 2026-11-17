import type { CreateOwnerCommand } from '@/application/commands/create-owner.command.js';
import type { UpdateOwnerCommand } from '@/application/commands/update-owner.command.js';
import type {
  OwnerEarnings,
  OwnerTransactions,
} from '@/application/models/owner-earnings.js';
import type { Bank } from '@/domain/bank.js';
import type { Owner } from '@/domain/owner.js';
import type { CreateOwnerRequest } from '@/infrastructure/http/dto/request/create/create-owner.request.js';
import type { UpdateOwnerRequest } from '@/infrastructure/http/dto/request/update/update-owner.request.js';
import type {
  OwnerEarningsResponse,
  OwnerTransactionsResponse,
} from '@/infrastructure/http/dto/response/owner-earnings.response.js';
import { OwnerResponse } from '@/infrastructure/http/dto/response/owner.response.js';
import { BankSummaryHttpMapper } from './bank-summary-http.mapper.js';
import { TransactionHttpMapper } from './transaction-http.mapper.js';

export class OwnerHttpMapper {
  static fromCreateRequestToCommand(
    request: CreateOwnerRequest,
  ): CreateOwnerCommand {
    return {
      name: request.name,
      phone: request.phone,
      email: request.email,
      bankId: request.bankId,
      accountNumber: request.accountNumber,
      accountType: request.accountType,
    };
  }

  static fromUpdateRequestToCommand(
    request: UpdateOwnerRequest,
  ): UpdateOwnerCommand {
    return {
      name: request.name,
      phone: request.phone,
      email: request.email,
      bankId: request.bankId,
      accountNumber: request.accountNumber,
      accountType: request.accountType,
    };
  }

  // /owners responses: include the account and the balance
  static fromDomainToResponse(owner: Owner): OwnerResponse {
    const data = owner.getData();
    const response = new OwnerResponse();
    response.id = data.id;
    response.name = data.name;
    response.phone = data.phone;
    response.email = data.email;
    response.bankId = data.bankId;
    response.accountNumber = data.accountNumber;
    response.accountType = data.accountType;
    response.balance = data.balance;
    return response;
  }

  // Used by POST /owners: also includes the bank summary
  static fromDomainWithBankToResponse(owner: Owner, bank: Bank): OwnerResponse {
    return {
      ...this.fromDomainToResponse(owner),
      bank: BankSummaryHttpMapper.fromDomainToResponse(bank),
    };
  }

  // Used inside property responses: the account and the balance are not
  // exposed
  static fromDomainWithBankToPublicResponse(
    owner: Owner,
    bank: Bank,
  ): OwnerResponse {
    const data = owner.getData();
    return {
      id: data.id,
      name: data.name,
      phone: data.phone,
      email: data.email,
      bankId: data.bankId,
      bank: BankSummaryHttpMapper.fromDomainToResponse(bank),
    };
  }

  static fromEarningsToResponse(
    earnings: OwnerEarnings,
  ): OwnerEarningsResponse {
    return {
      ownerId: earnings.owner.getId(),
      totalEarnings: earnings.totalEarnings,
    };
  }

  static fromTransactionsToResponse(
    detail: OwnerTransactions,
  ): OwnerTransactionsResponse {
    return {
      ownerId: detail.owner.getId(),
      transactions: detail.transactions.map((transaction) =>
        TransactionHttpMapper.fromDomainToResponse(transaction),
      ),
    };
  }
}
