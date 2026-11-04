import { OmitType, PartialType } from '@nestjs/swagger';
import { CreatePropertyRequest } from '../create/create-property.request.js';

export class UpdatePropertyRequest extends PartialType(
  OmitType(CreatePropertyRequest, ['ownerId', 'cityId'] as const),
  { skipNullProperties: false },
) {}
