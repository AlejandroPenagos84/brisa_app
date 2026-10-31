import { CreateOwnerCommand } from '@/application/commands/create-owner.command.js';
import { Owner } from '@/domain/owner.js';
import { CreateOwnerRequest } from '@/infrastructure/http/dto/create-owner.request.js';
import { OwnerResponse } from '@/infrastructure/http/dto/owner.response.js';

export class OwnerHttpMapper {
  static fromCreateRequestToCommand(
    request: CreateOwnerRequest,
  ): CreateOwnerCommand {
    return {
      name: request.name.trim(),
      phone: request.phone.trim(),
      email: request.email.trim().toLowerCase(),
      bankId: request.bankId,
    };
  }

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
}
