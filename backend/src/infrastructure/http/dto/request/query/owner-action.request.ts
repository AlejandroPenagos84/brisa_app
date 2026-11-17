import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

// Query of DELETE /properties/:id?ownerId=...  A DELETE should not have a
// body, so the owner making the request goes in the query string
export class OwnerActionRequest {
  @ApiProperty({
    description: 'Identifier of the owner making the request',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    format: 'uuid',
  })
  @IsUUID()
  ownerId: string;
}
