import { PartialType } from '@nestjs/swagger';
import { CreateOwnerRequest } from '../create/create-owner.request.js';

export class UpdateOwnerRequest extends PartialType(CreateOwnerRequest, {
  skipNullProperties: false,
}) {}
