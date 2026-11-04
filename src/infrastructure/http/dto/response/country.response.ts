import { ApiProperty } from '@nestjs/swagger';

export class CountryResponse {
  @ApiProperty({
    description: 'Country identifier',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({ description: 'Country name', example: 'Colombia' })
  name: string;
}
