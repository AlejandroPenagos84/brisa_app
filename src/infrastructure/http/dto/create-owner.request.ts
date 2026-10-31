import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

// Body received from the frontend. Max lengths match the owners table.
export class CreateOwnerRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone: string;

  @IsEmail()
  @MaxLength(150)
  email: string;

  @IsUUID()
  bankId: string;
}
