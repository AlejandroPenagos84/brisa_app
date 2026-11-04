import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BankSummaryResponse } from './bank-summary.response.js';

// Body sent to the frontend
export class OwnerResponse {
  @ApiProperty({
    description: 'Owner identifier',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({ description: 'Owner full name', example: 'Ana Gómez' })
  name: string;

  @ApiProperty({ description: 'Owner phone number', example: '3001234567' })
  phone: string;

  @ApiProperty({
    description: 'Owner email address',
    example: 'ana@example.com',
    format: 'email',
  })
  email: string;

  @ApiProperty({
    description: 'Identifier of the bank linked to the owner',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    format: 'uuid',
  })
  bankId: string;

  @ApiPropertyOptional({
    description:
      'Owner balance. Only included in /owners responses, not inside properties.',
    example: 1500.5,
  })
  balance?: number;

  @ApiPropertyOptional({
    description: 'Bank summary. Included in the create response.',
    type: BankSummaryResponse,
  })
  bank?: BankSummaryResponse;
}
