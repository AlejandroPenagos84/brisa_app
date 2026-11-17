import { ApiProperty } from '@nestjs/swagger';

export class CitySummaryResponse {
  @ApiProperty({
    description: 'City identifier',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({ description: 'City name', example: 'Bogotá' })
  name: string;
}
