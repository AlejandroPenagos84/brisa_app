import { ApiProperty } from '@nestjs/swagger';

export class AdministratorResponse {
  @ApiProperty({
    description: 'Administrator identifier',
    example: 'f0000000-0000-4000-8000-000000000001',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Administrator name',
    example: 'Administrador Brisa',
  })
  name: string;

  @ApiProperty({
    description: 'Administrator phone number',
    example: '3000000000',
  })
  phone: string;

  @ApiProperty({
    description: 'Administrator email address',
    example: 'admin@brisa.example.com',
    format: 'email',
  })
  email: string;

  @ApiProperty({
    description: 'Identifier of the bank that receives the payments',
    example: 'b0000000-0000-4000-8000-000000000001',
    format: 'uuid',
  })
  bankId: string;

  @ApiProperty({ description: 'Bank account number', example: '9001001001' })
  accountNumber: string;

  @ApiProperty({ description: 'Bank account type', example: 'Corriente' })
  accountType: string;

  @ApiProperty({ description: 'Accumulated commissions', example: 982 })
  balance: number;
}
