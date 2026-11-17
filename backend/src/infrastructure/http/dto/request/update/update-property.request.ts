import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PropertyStatus } from '@/domain/property.js';
import { CreatePropertyRequest } from '@/infrastructure/http/dto/request/create/create-property.request.js';

export class UpdatePropertyRequest extends PartialType(
  OmitType(CreatePropertyRequest, ['ownerId', 'cityId'] as const),
  { skipNullProperties: false },
) {
  // Who makes the change, not a field to change: only the owner of the
  // property can edit it (403 PROPERTY_NOT_OWNED otherwise)
  @ApiProperty({
    description: 'Identifier of the owner making the change',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    format: 'uuid',
  })
  @IsUUID()
  ownerId: string;

  @ApiPropertyOptional({
    description: 'Property availability status',
    enum: PropertyStatus,
    example: PropertyStatus.INACTIVE,
  })
  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;
}
