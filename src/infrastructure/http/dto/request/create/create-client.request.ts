import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateClientRequest {
  @ApiProperty({
    description: 'Client full name',
    example: 'Ana Gómez',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Client phone number',
    example: '3001234567',
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone: string;

  @ApiProperty({
    description: 'Client email address',
    example: 'ana@example.com',
    format: 'email',
    maxLength: 150,
  })
  @IsEmail()
  @MaxLength(150)
  email: string;

  @ApiProperty({
    description: 'Identifier of the city where the client lives',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    format: 'uuid',
  })
  @IsUUID()
  cityId: string;

  @ApiProperty({
    description: 'Identifier of the bank linked to the client account',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    format: 'uuid',
  })
  @IsUUID()
  bankId: string;

  @ApiProperty({
    description: 'Client bank account number',
    example: '1234567890',
    maxLength: 30,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  accountNumber: string;

  @ApiProperty({
    description: 'Client bank account type',
    example: 'Ahorros',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  accountType: string;

  @ApiProperty({
    description: 'Initial account balance',
    example: 100,
    default: 0,
    minimum: 0,
    maximum: 9_999_999_999.99,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(9_999_999_999.99)
  balance: number = 0;
}
