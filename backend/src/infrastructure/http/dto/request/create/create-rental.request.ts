import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsUUID } from 'class-validator';

export class CreateRentalRequest {
  @ApiProperty({
    description: 'Identifier of the rented property',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    format: 'uuid',
  })
  @IsUUID()
  propertyId: string;

  @ApiProperty({
    description: 'Identifier of the client renting the property',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    format: 'uuid',
  })
  @IsUUID()
  clientId: string;

  @ApiProperty({
    description: 'Rental start date',
    example: '2026-11-01',
    format: 'date',
  })
  @IsDateString({ strict: true })
  startDate: string;

  @ApiProperty({
    description: 'Rental end date, must be after the start date',
    example: '2026-11-10',
    format: 'date',
  })
  @IsDateString({ strict: true })
  endDate: string;
}
