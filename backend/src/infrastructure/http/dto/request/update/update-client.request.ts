import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateClientRequest } from '../create/create-client.request.js';

export class UpdateClientRequest extends PartialType(
  OmitType(CreateClientRequest, ['balance'] as const),
) {}
