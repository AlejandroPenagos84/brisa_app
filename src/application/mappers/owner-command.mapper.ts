import { CreateOwnerCommand } from '@/application/commands/create-owner.command.js';
import { Owner } from '@/domain/owner.js';
import { UUID } from '@/utils/types.js';

export class OwnerCommandMapper {
  static fromCreateCommandToDomain(
    id: UUID,
    command: CreateOwnerCommand,
  ): Owner {
    return new Owner(
      id,
      command.name,
      command.phone,
      command.email,
      command.bankId,
    );
  }
}
