import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

// Body received from the frontend. Max lengths match the owners table.
// There is no initial balance: it only changes through rental payments.
export class CreateOwnerRequest {
  @ApiProperty({
    description: 'Owner full name',
    example: 'Ana Gómez',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Owner phone number',
    example: '3001234567',
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone: string;

  @ApiProperty({
    description: 'Owner email address',
    example: 'ana@example.com',
    format: 'email',
    maxLength: 150,
  })
  @IsEmail()
  @MaxLength(150)
  email: string;

  @ApiProperty({
    description: 'Identifier of the bank linked to the owner',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    format: 'uuid',
  })
  @IsUUID()
  bankId: string;

  @ApiProperty({
    description:
      'Owner bank account number, where the owner receives the payments',
    example: '5001001001',
    maxLength: 30,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  accountNumber: string;

  @ApiProperty({
    description: 'Owner bank account type',
    example: 'Ahorros',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  accountType: string;
}
