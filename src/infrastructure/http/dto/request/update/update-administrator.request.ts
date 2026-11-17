import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

// Every field is optional; only the ones sent are changed.
// The balance is not editable: it only changes through rental payments.
export class UpdateAdministratorRequest {
  @ApiPropertyOptional({ description: 'Administrator name', maxLength: 100 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Phone number', maxLength: 20 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({
    description: 'Email address',
    format: 'email',
    maxLength: 150,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;

  @ApiPropertyOptional({ description: 'Bank identifier', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  bankId?: string;

  @ApiPropertyOptional({ description: 'Bank account number', maxLength: 30 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  accountNumber?: string;

  @ApiPropertyOptional({ description: 'Bank account type', maxLength: 50 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  accountType?: string;
}
