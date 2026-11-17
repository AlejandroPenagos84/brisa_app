import { ApiProperty } from '@nestjs/swagger';
import { RentalResponse } from '@/infrastructure/http/dto/response/rental.response.js';

// Simulated payment receipt: there is no payment gateway, the payment from
// the client's bank account is always approved
export class PaymentReceiptResponse {
  @ApiProperty({
    description: 'Identifier of the payment transaction',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    format: 'uuid',
  })
  transactionId: string;

  @ApiProperty({
    description: 'Payment status (simulated payments are always approved)',
    enum: ['APPROVED'],
    example: 'APPROVED',
  })
  status: 'APPROVED';

  @ApiProperty({ description: 'Amount paid: nights × price per night', example: 440 })
  amount: number;

  @ApiProperty({
    description: 'Client bank account the payment came from, masked',
    example: '****3001',
  })
  paidFromAccount: string;

  @ApiProperty({
    description: 'Date of the payment',
    example: '2026-11-17T15:30:00.000Z',
    format: 'date-time',
  })
  paidAt: Date;
}

export class ReservationResponse extends RentalResponse {
  @ApiProperty({ description: 'Payment receipt', type: PaymentReceiptResponse })
  payment: PaymentReceiptResponse;
}
