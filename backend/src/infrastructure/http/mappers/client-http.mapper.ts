import type { CreateClientCommand } from '@/application/commands/create-client.command.js';
import type { UpdateClientCommand } from '@/application/commands/update-client.command.js';
import type { ClientDetails } from '@/application/models/client-details.js';
import { Client } from '@/domain/client.js';
import { BankHttpMapper } from './bank-http.mapper.js';
import {
  ClientResponse,
  ClientDetailsResponse,
} from '../dto/response/client.response.js';
import { CreateClientRequest } from '../dto/request/create/create-client.request.js';
import { UpdateClientRequest } from '../dto/request/update/update-client.request.js';
import { normalizeEmail, trimText } from './mapping.utils.js';

export class ClientHttpMapper {
  static fromCreateRequestToCommand(
    request: CreateClientRequest,
  ): CreateClientCommand {
    return {
      name: trimText(request.name),
      phone: trimText(request.phone),
      email: normalizeEmail(request.email),
      cityId: request.cityId,
      bankId: request.bankId,
      accountNumber: trimText(request.accountNumber),
      accountType: trimText(request.accountType),
      balance: request.balance,
    };
  }

  static fromUpdateRequestToCommand(
    request: UpdateClientRequest,
  ): UpdateClientCommand {
    return {
      name: trimText(request.name),
      phone: trimText(request.phone),
      email: normalizeEmail(request.email),
      cityId: request.cityId,
      bankId: request.bankId,
      accountNumber: trimText(request.accountNumber),
      accountType: trimText(request.accountType),
    };
  }

  static fromDomainToBasicResponse(client: Client): ClientResponse {
    const data = client.getData();
    return {
      id: data.id,
      name: data.name,
      phone: data.phone,
      email: data.email,
      cityId: data.cityId,
      bankId: data.bankId,
      accountNumber: data.accountNumber,
      accountType: data.accountType,
      balance: data.balance,
    };
  }

  static fromDetailsToResponse(details: ClientDetails): ClientDetailsResponse {
    return {
      ...this.fromDomainToBasicResponse(details.client),
      bank: BankHttpMapper.fromDetailsToResponse({
        bank: details.bank,
        country: details.country,
      }),
    };
  }
}
