import { ApiProperty } from '@nestjs/swagger';
import { BankDetailsResponse } from './bank.response.js';

export class ClientResponse {
  @ApiProperty({
    description: 'Client identifier',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({ description: 'Client full name', example: 'Ana Gómez' })
  name: string;

  @ApiProperty({ description: 'Client phone number', example: '3001234567' })
  phone: string;

  @ApiProperty({
    description: 'Client email address',
    example: 'ana@example.com',
    format: 'email',
  })
  email: string;

  @ApiProperty({
    description: 'Identifier of the city where the client lives',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    format: 'uuid',
  })
  cityId: string;

  @ApiProperty({
    description: 'Identifier of the bank linked to the client account',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    format: 'uuid',
  })
  bankId: string;

  @ApiProperty({
    description: 'Client bank account number',
    example: '1234567890',
  })
  accountNumber: string;

  @ApiProperty({ description: 'Client bank account type', example: 'Ahorros' })
  accountType: string;

  @ApiProperty({ description: 'Current account balance', example: 100 })
  balance: number;
}

export class ClientDetailsResponse extends ClientResponse {
  @ApiProperty({
    description: 'Bank linked to the client account',
    type: BankDetailsResponse,
  })
  bank: BankDetailsResponse;
}
