import { ApiProperty } from '@nestjs/swagger';
import { CountryResponse } from './country.response.js';

export class CityResponse {
  @ApiProperty({
    description: 'City identifier',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({ description: 'City name', example: 'Bogotá' })
  name: string;

  @ApiProperty({
    description: 'Identifier of the country the city belongs to',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    format: 'uuid',
  })
  countryId: string;
}

export class CityDetailsResponse extends CityResponse {
  @ApiProperty({ description: 'Country the city belongs to', type: CountryResponse })
  country: CountryResponse;
}
