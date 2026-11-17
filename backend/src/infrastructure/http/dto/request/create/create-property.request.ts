import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePropertyRequest {
  @ApiProperty({
    description: 'Identifier of the property owner',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    format: 'uuid',
  })
  @IsUUID()
  ownerId: string;

  @ApiProperty({
    description: 'Identifier of the city where the property is located',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    format: 'uuid',
  })
  @IsUUID()
  cityId: string;

  @ApiProperty({
    description: 'Property address',
    example: 'Calle 123 #45-67',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  address: string;

  @ApiProperty({
    description: 'Property area in square meters',
    example: 85.5,
    minimum: 0.01,
    maximum: 99_999_999.99,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(99_999_999.99)
  area: number;

  @ApiProperty({
    description: 'Number of rooms',
    example: 3,
    minimum: 0,
    maximum: 2_147_483_647,
  })
  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  numberOfRooms: number;

  @ApiProperty({
    description: 'Maximum number of guests',
    example: 6,
    minimum: 1,
    maximum: 2_147_483_647,
  })
  @IsInt()
  @Min(1)
  @Max(2_147_483_647)
  capacity: number;

  @ApiProperty({
    description: 'Monthly rental price',
    example: 1500.5,
    minimum: 0.01,
    maximum: 9_999_999_999.99,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(9_999_999_999.99)
  price: number;
}
