import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

// Text fields of POST /properties/:id/images (multipart/form-data).
// The file itself goes in the "file" field and is read by FileInterceptor
export class AddPropertyImageRequest {
  @ApiProperty({
    description: 'Identifier of the owner making the request',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    format: 'uuid',
  })
  @IsUUID()
  ownerId: string;
}
