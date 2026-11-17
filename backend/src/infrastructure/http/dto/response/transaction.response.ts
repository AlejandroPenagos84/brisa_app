import { ApiProperty } from '@nestjs/swagger';

// Movement between the administrator and an owner
export class TransactionResponse {
  @ApiProperty({
    description: 'Transaction identifier',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Administrator identifier',
    example: 'f0000000-0000-4000-8000-000000000001',
    format: 'uuid',
  })
  administratorId: string;

  @ApiProperty({
    description: 'Owner identifier',
    example: 'a0000000-0000-4000-8000-000000000001',
    format: 'uuid',
  })
  ownerId: string;

  @ApiProperty({
    description:
      'PAYMENT when a client paid a rental, REFUND when a rental was cancelled',
    enum: ['PAYMENT', 'REFUND'],
    example: 'PAYMENT',
  })
  type: 'PAYMENT' | 'REFUND';

  @ApiProperty({ description: 'Amount paid by the client', example: 500 })
  grossAmount: number;

  @ApiProperty({
    description: 'Administrator commission (10%)',
    example: 50,
  })
  commission: number;

  @ApiProperty({ description: 'Amount for the owner', example: 450 })
  netAmount: number;

  @ApiProperty({
    description: 'Date of the transaction',
    example: '2026-11-17T15:30:00.000Z',
    format: 'date-time',
  })
  createdAt: Date;
}
