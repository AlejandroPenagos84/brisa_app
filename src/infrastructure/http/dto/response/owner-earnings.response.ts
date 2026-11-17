import { ApiProperty } from '@nestjs/swagger';
import { TransactionResponse } from './transaction.response.js';

export class OwnerEarningsResponse {
  @ApiProperty({
    description: 'Owner identifier',
    example: 'a0000000-0000-4000-8000-000000000001',
    format: 'uuid',
  })
  ownerId: string;

  @ApiProperty({
    description:
      'Total earned: net amount of the payments minus net amount of the refunds',
    example: 2520,
  })
  totalEarnings: number;
}

export class OwnerTransactionsResponse {
  @ApiProperty({
    description: 'Owner identifier',
    example: 'a0000000-0000-4000-8000-000000000001',
    format: 'uuid',
  })
  ownerId: string;

  @ApiProperty({
    description: 'Transactions of the owner, newest first',
    type: [TransactionResponse],
  })
  transactions: TransactionResponse[];
}
