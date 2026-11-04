import { Bank } from '@/domain/bank.js';
import { Owner } from '@/domain/owner.js';
import { BankSummaryHttpMapper } from './bank-summary-http.mapper.js';
import { CreateOwnerCommand } from '@/application/commands/create-owner.command.js';
import type { UpdateOwnerCommand } from '@/application/commands/update-owner.command.js';
import { CreateOwnerRequest } from '@/infrastructure/http/dto/request/create/create-owner.request.js';
import type { UpdateOwnerRequest } from '@/infrastructure/http/dto/request/update/update-owner.request.js';
import { OwnerResponse } from '@/infrastructure/http/dto/response/owner.response.js';
import { normalizeEmail, trimText } from './mapping.utils.js';

export class OwnerHttpMapper {
  static fromUpdateRequestToCommand(
    request: UpdateOwnerRequest,
  ): UpdateOwnerCommand {
    return {
      name: request.name,
      phone: request.phone,
      email: request.email,
      bankId: request.bankId,
    };
  }

  static fromCreateRequestToCommand(
    request: CreateOwnerRequest,
  ): CreateOwnerCommand {
    return {
      name: trimText(request.name),
      phone: trimText(request.phone),
      email: normalizeEmail(request.email),
      bankId: request.bankId,
    };
  }

  // Legacy mapping used by the current controller until it supplies the bank.
  static fromDomainToResponse(owner: Owner): OwnerResponse {
    const data = owner.getData();
    const response = new OwnerResponse();
    response.id = data.id;
    response.name = data.name;
    response.phone = data.phone;
    response.email = data.email;
    response.bankId = data.bankId;
    return response;
  }

  static fromDomainWithBankToResponse(owner: Owner, bank: Bank): OwnerResponse {
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
}
