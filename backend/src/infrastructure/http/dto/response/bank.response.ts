import { ApiProperty } from '@nestjs/swagger';
import { BankSummaryResponse } from './bank-summary.response.js';
import { CountryResponse } from './country.response.js';

export class BankResponse extends BankSummaryResponse {
  @ApiProperty({
    description: 'Identifier of the country where the bank operates',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    format: 'uuid',
  })
  countryId: string;
}

export class BankDetailsResponse extends BankResponse {
  @ApiProperty({ description: 'Country where the bank operates', type: CountryResponse })
  country: CountryResponse;
}
