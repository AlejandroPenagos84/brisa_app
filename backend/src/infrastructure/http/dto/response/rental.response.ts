import { ApiProperty } from '@nestjs/swagger';
import { ClientResponse } from './client.response.js';
import { PropertyResponse } from './property.response.js';

export class RentalResponse {
  @ApiProperty({
    description: 'Identifier of the rented property',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    format: 'uuid',
  })
  propertyId: string;

  @ApiProperty({
    description: 'Identifier of the client renting the property',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    format: 'uuid',
  })
  clientId: string;

  @ApiProperty({
    description: 'Rental start date',
    example: '2026-11-01T00:00:00.000Z',
    format: 'date-time',
  })
  startDate: Date;

  @ApiProperty({
    description: 'Rental end date',
    example: '2026-11-10T00:00:00.000Z',
    format: 'date-time',
  })
  endDate: Date;

  @ApiProperty({
    description: 'Rental status',
    enum: ['UPCOMING', 'ACTIVE', 'FINISHED'],
    example: 'UPCOMING',
  })
  status: 'UPCOMING' | 'ACTIVE' | 'FINISHED';
}

export class RentalDetailsResponse extends RentalResponse {
  @ApiProperty({ description: 'Rented property', type: PropertyResponse })
  property: PropertyResponse;

  @ApiProperty({ description: 'Client renting the property', type: ClientResponse })
  client: ClientResponse;
}
