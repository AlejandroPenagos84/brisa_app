import { ApiProperty } from '@nestjs/swagger';
import { CitySummaryResponse } from './city-summary.response.js';
import { OwnerResponse } from './owner.response.js';

export class PropertyResponse {
  @ApiProperty({
    description: 'Property identifier',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Identifier of the property owner',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    format: 'uuid',
  })
  ownerId: string;

  @ApiProperty({
    description: 'Identifier of the city where the property is located',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    format: 'uuid',
  })
  cityId: string;

  @ApiProperty({ description: 'Property address', example: 'Calle 123 #45-67' })
  address: string;

  @ApiProperty({ description: 'Property area in square meters', example: 85.5 })
  area: number;

  @ApiProperty({ description: 'Number of rooms', example: 3 })
  numberOfRooms: number;

  @ApiProperty({ description: 'Maximum number of guests', example: 6 })
  capacity: number;

  @ApiProperty({ description: 'Monthly rental price', example: 1500.5 })
  price: number;

  @ApiProperty({
    description: 'Property status',
    enum: ['ACTIVE', 'INACTIVE'],
    example: 'ACTIVE',
  })
  status: 'ACTIVE' | 'INACTIVE';
}

export class PropertyDetailsResponse extends PropertyResponse {
  @ApiProperty({ description: 'Property owner', type: OwnerResponse })
  owner: OwnerResponse;

  @ApiProperty({ description: 'City where the property is located', type: CitySummaryResponse })
  city: CitySummaryResponse;
}
