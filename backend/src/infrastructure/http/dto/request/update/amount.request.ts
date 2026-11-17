import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, Max } from 'class-validator';

// Body for deposits and withdrawals of clients and owners
export class AmountRequest {
  @ApiProperty({
    description: 'Amount to deposit or withdraw',
    example: 50.25,
    minimum: 0.01,
    maximum: 9_999_999_999.99,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(9_999_999_999.99)
  amount: number;
}
