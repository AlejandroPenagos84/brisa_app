import type { UpdateAdministratorCommand } from '@/application/commands/update-administrator.command.js';
import type { Administrator } from '@/domain/administrator.js';
import type { UpdateAdministratorRequest } from '@/infrastructure/http/dto/request/update/update-administrator.request.js';
import type { AdministratorResponse } from '@/infrastructure/http/dto/response/administrator.response.js';

export class AdministratorHttpMapper {
  static fromUpdateRequestToCommand(
    request: UpdateAdministratorRequest,
  ): UpdateAdministratorCommand {
    return {
      name: request.name,
      phone: request.phone,
      email: request.email,
      bankId: request.bankId,
      accountNumber: request.accountNumber,
      accountType: request.accountType,
    };
  }

  static fromDomainToResponse(
    administrator: Administrator,
  ): AdministratorResponse {
    const data = administrator.getData();
    return {
      id: data.id,
      name: data.name,
      phone: data.phone,
      email: data.email,
      bankId: data.bankId,
      accountNumber: data.accountNumber,
      accountType: data.accountType,
      balance: data.balance,
    };
  }
}
