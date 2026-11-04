import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PropertyStatus } from '@/domain/property.js';
import { CreatePropertyRequest } from '../create/create-property.request.js';

export class UpdatePropertyRequest extends PartialType(
  OmitType(CreatePropertyRequest, ['ownerId', 'cityId'] as const),
  { skipNullProperties: false },
) {
  @ApiPropertyOptional({
    description: 'Property availability status',
    enum: PropertyStatus,
    example: PropertyStatus.INACTIVE,
  })
  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;
}
